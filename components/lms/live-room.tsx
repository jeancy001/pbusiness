"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Radio,
  Square,
  Users,
  Video,
} from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize, type LocalizedText } from "@/lib/mock-data"
import { endLiveAction } from "@/lib/lms/actions"
import { Logo } from "@/components/site/logo"
import { FormError, formatDateTime } from "@/components/lms/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Native WebRTC classroom, star topology: the teacher holds one peer
// connection per student. Students receive the teacher's camera/screen and
// send their own webcam to the teacher. Signaling goes through
// /api/live/[id]/signal; attendance through /api/live/[id]/attendance.

const POLL_MS = 1000
const HEARTBEAT_MS = 30_000
/** Host re-sends an offer that got no answer (student tab asleep, lost poll). */
const OFFER_RETRY_MS = 12_000

type Role = "host" | "attendee"
type Peer = { peerId: string; userId: string; name: string; role: Role }
type Signal = { from: string; type: "offer" | "answer" | "candidate" | "bye"; payload: unknown }
type Remote = { name: string; stream: MediaStream | null; state: RTCPeerConnectionState }

type Phase = "lobby" | "joining" | "in" | "left" | "ended"

export function LiveRoom({
  id,
  topic,
  courseTitle,
  startAt,
  durationMin,
  ended,
  isHost,
  backHref,
}: {
  id: string
  topic: string
  courseTitle: LocalizedText | null
  startAt: string
  durationMin: number
  ended: boolean
  isHost: boolean
  backHref: string
}) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>(ended ? "ended" : "lobby")
  const [error, setError] = useState<string | null>(null)
  const [camOk, setCamOk] = useState<boolean | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [remotes, setRemotes] = useState<Record<string, Remote>>({})
  const [present, setPresent] = useState<Peer[]>([])

  const localRef = useRef<MediaStream | null>(null)
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null)
  const screenRef = useRef<MediaStream | null>(null)
  const pcs = useRef(new Map<string, RTCPeerConnection>())
  const pendingIce = useRef(new Map<string, RTCIceCandidateInit[]>())
  // Our own candidates are held until the offer/answer they belong to has been
  // posted, so the other side never receives a candidate before its description.
  const outgoingIce = useRef(new Map<RTCPeerConnection, RTCIceCandidateInit[] | null>())
  const offeredAt = useRef(new Map<string, number>())
  const names = useRef(new Map<string, string>())
  const cfg = useRef<{ peerId: string; hostUserId: string; iceServers: RTCIceServer[]; role: Role } | null>(null)
  const running = useRef(false)
  const cursor = useRef<string | null>(null)
  const tab = useRef(Math.random().toString(36).slice(2, 10))
  const selfVideo = useRef<HTMLVideoElement>(null)

  // ==========================================================
  // TRANSPORT
  // ==========================================================

  const send = useCallback(
    (to: string, type: Signal["type"], payload: unknown) =>
      fetch(`/api/live/${id}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: cfg.current!.peerId, to, type, payload }),
      }).catch(() => undefined),
    [id],
  )

  const report = useCallback(
    (event: "join" | "heartbeat" | "leave") => {
      const body = JSON.stringify({ event, peerId: cfg.current?.peerId })
      const url = `/api/live/${id}/attendance`
      if (event === "leave" && navigator.sendBeacon) return void navigator.sendBeacon(url, body)
      void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
    },
    [id],
  )

  // ==========================================================
  // PEER CONNECTIONS
  // ==========================================================

  const updateRemote = (peerId: string, patch: Partial<Remote>) =>
    setRemotes((r) => {
      const base: Remote = r[peerId] ?? { name: names.current.get(peerId) ?? "", stream: null, state: "new" }
      return { ...r, [peerId]: { ...base, ...patch } }
    })

  const closePeer = useCallback((peerId: string) => {
    pcs.current.get(peerId)?.close()
    pcs.current.delete(peerId)
    pendingIce.current.delete(peerId)
    offeredAt.current.delete(peerId)
    setRemotes(({ [peerId]: _gone, ...rest }) => rest)
  }, [])

  const createPeer = useCallback(
    (peerId: string) => {
      pcs.current.get(peerId)?.close()
      const pc = new RTCPeerConnection({ iceServers: cfg.current!.iceServers })
      pcs.current.set(peerId, pc)

      const local = localRef.current
      if (local) {
        for (const track of local.getTracks()) {
          // When sharing, new students get the screen instead of the camera.
          const outgoing = track.kind === "video" && screenRef.current ? screenRef.current.getVideoTracks()[0] : track
          pc.addTrack(outgoing, local)
        }
      } else {
        // Joined without devices: still receive.
        pc.addTransceiver("video", { direction: "recvonly" })
        pc.addTransceiver("audio", { direction: "recvonly" })
      }

      outgoingIce.current.set(pc, [])
      pc.onicecandidate = (e) => {
        if (!e.candidate) return
        const held = outgoingIce.current.get(pc)
        if (held) held.push(e.candidate.toJSON())
        else void send(peerId, "candidate", e.candidate.toJSON())
      }
      pc.ontrack = (e) => updateRemote(peerId, { stream: e.streams[0] ?? new MediaStream([e.track]) })
      pc.onconnectionstatechange = () => {
        updateRemote(peerId, { state: pc.connectionState })
        // Encodings exist only after negotiation; cap bitrate then (the teacher uploads one copy per student).
        if (pc.connectionState === "connected") {
          for (const sender of pc.getSenders()) {
            if (sender.track?.kind !== "video") continue
            const params = sender.getParameters()
            if (!params.encodings?.length) continue
            params.encodings[0].maxBitrate = cfg.current!.role === "host" ? 900_000 : 300_000
            void sender.setParameters(params).catch(() => undefined)
          }
        }
      }
      updateRemote(peerId, { state: "new" })
      return pc
    },
    [send],
  )

  /** Post our offer/answer, then the candidates gathered meanwhile, in that order. */
  const sendDescription = useCallback(
    async (peerId: string, pc: RTCPeerConnection, type: "offer" | "answer") => {
      await send(peerId, type, pc.localDescription!.toJSON())
      const held = outgoingIce.current.get(pc) ?? []
      outgoingIce.current.set(pc, null)
      for (const c of held) await send(peerId, "candidate", c)
    },
    [send],
  )

  const flushIce = async (peerId: string, pc: RTCPeerConnection) => {
    for (const c of pendingIce.current.get(peerId) ?? []) await pc.addIceCandidate(c).catch(() => undefined)
    pendingIce.current.delete(peerId)
  }

  const handleSignal = useCallback(
    async (msg: Signal) => {
      const role = cfg.current!.role
      if (msg.type === "offer" && role === "attendee") {
        // Every new offer from the teacher replaces the previous connection.
        const pc = createPeer(msg.from)
        await pc.setRemoteDescription(msg.payload as RTCSessionDescriptionInit)
        await flushIce(msg.from, pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        await sendDescription(msg.from, pc, "answer")
      } else if (msg.type === "answer" && role === "host") {
        const pc = pcs.current.get(msg.from)
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(msg.payload as RTCSessionDescriptionInit)
          offeredAt.current.delete(msg.from)
          await flushIce(msg.from, pc)
        }
      } else if (msg.type === "candidate") {
        const pc = pcs.current.get(msg.from)
        const candidate = msg.payload as RTCIceCandidateInit
        if (pc?.remoteDescription) await pc.addIceCandidate(candidate).catch(() => undefined)
        else pendingIce.current.set(msg.from, [...(pendingIce.current.get(msg.from) ?? []), candidate])
      } else if (msg.type === "bye") {
        closePeer(msg.from)
      }
    },
    [closePeer, createPeer, sendDescription],
  )

  /** Host: open a connection to every student present that has none (or a dead one). */
  const reconcile = useCallback(
    async (peers: Peer[]) => {
      const me = cfg.current!
      const others = peers.filter((p) => p.peerId !== me.peerId)
      for (const p of others) names.current.set(p.peerId, p.name)

      if (me.role === "host") {
        for (const p of others) {
          const pc = pcs.current.get(p.peerId)
          const unanswered = pc?.signalingState === "have-local-offer" && Date.now() - (offeredAt.current.get(p.peerId) ?? 0) > OFFER_RETRY_MS
          if (pc && !unanswered && !["failed", "closed"].includes(pc.connectionState)) continue
          const fresh = createPeer(p.peerId)
          const offer = await fresh.createOffer()
          await fresh.setLocalDescription(offer)
          offeredAt.current.set(p.peerId, Date.now())
          await sendDescription(p.peerId, fresh, "offer")
        }
      }
      // Drop peers that left the room.
      for (const peerId of [...pcs.current.keys()]) if (!others.some((p) => p.peerId === peerId)) closePeer(peerId)
    },
    [closePeer, createPeer, sendDescription],
  )

  const pollLoop = useCallback(async () => {
    while (running.current) {
      try {
        const q = new URLSearchParams({ peer: cfg.current!.peerId, ...(cursor.current ? { since: cursor.current } : {}) })
        const res = await fetch(`/api/live/${id}/signal?${q}`, { cache: "no-store" })
        if (res.ok) {
          const data = (await res.json()) as { cursor: string | null; messages: Signal[]; peers: Peer[]; status: string }
          cursor.current = data.cursor
          for (const m of data.messages) await handleSignal(m).catch((e) => console.warn("signal", e))
          setPresent(data.peers)
          await reconcile(data.peers)
          if (data.status === "ended" && cfg.current!.role === "attendee") {
            stopEverything()
            setPhase("ended")
            return
          }
        }
      } catch {
        // transient network error: keep polling
      }
      await new Promise((r) => setTimeout(r, POLL_MS))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSignal, id, reconcile])

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  function stopEverything() {
    running.current = false
    for (const peerId of [...pcs.current.keys()]) {
      void send(peerId, "bye", null)
      pcs.current.get(peerId)?.close()
    }
    pcs.current.clear()
    localRef.current?.getTracks().forEach((t) => t.stop())
    screenRef.current?.getTracks().forEach((t) => t.stop())
    localRef.current = null
    screenRef.current = null
    setRemotes({})
  }

  // Lobby preview; the same stream is reused when joining.
  useEffect(() => {
    if (phase !== "lobby") return
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({
        video: isHost ? { width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { max: 15 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        localRef.current = stream
        cameraTrackRef.current = stream.getVideoTracks()[0] ?? null
        attach(selfVideo.current, stream)
        setCamOk(true)
      })
      .catch(() => setCamOk(false))
    return () => {
      cancelled = true
    }
  }, [phase, isHost])

  useEffect(() => {
    if (localRef.current) attach(selfVideo.current, screenRef.current ?? localRef.current)
  }, [phase, sharing])

  useEffect(() => {
    if (phase !== "in") return
    const beat = setInterval(() => report("heartbeat"), HEARTBEAT_MS)
    const onHide = () => report("leave")
    window.addEventListener("pagehide", onHide)
    return () => {
      clearInterval(beat)
      window.removeEventListener("pagehide", onHide)
    }
  }, [phase, report])

  useEffect(
    () => () => {
      if (running.current) {
        report("leave")
        stopEverything()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  async function join() {
    setError(null)
    setPhase("joining")
    try {
      const res = await fetch(`/api/live/${id}/join`, { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Unable to join")
      cfg.current = { peerId: `${data.userId}:${tab.current}`, hostUserId: data.hostUserId, iceServers: data.iceServers, role: data.role }
      report("join")
      running.current = true
      setPhase("in")
      void pollLoop()
    } catch (e) {
      setError((e as Error).message)
      setPhase("lobby")
    }
  }

  function leave() {
    report("leave")
    stopEverything()
    setPhase("left")
  }

  async function endClass() {
    if (!confirm(fr ? "Terminer le cours pour tout le monde ?" : "End the class for everyone?")) return
    await endLiveAction(id)
    leave()
    router.refresh()
  }

  // ==========================================================
  // CONTROLS
  // ==========================================================

  function toggleMic() {
    const next = !micOn
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = next))
    setMicOn(next)
  }

  function toggleCam() {
    const next = !camOn
    cameraTrackRef.current && (cameraTrackRef.current.enabled = next)
    setCamOn(next)
  }

  async function replaceOutgoingVideo(track: MediaStreamTrack | null) {
    for (const pc of pcs.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.track === null)
      await sender?.replaceTrack(track).catch(() => undefined)
    }
  }

  async function toggleShare() {
    if (sharing) {
      screenRef.current?.getTracks().forEach((t) => t.stop())
      screenRef.current = null
      await replaceOutgoingVideo(cameraTrackRef.current)
      setSharing(false)
      return
    }
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true })
      screenRef.current = screen
      const track = screen.getVideoTracks()[0]
      track.onended = () => void (screenRef.current && toggleShareOff())
      await replaceOutgoingVideo(track)
      setSharing(true)
    } catch {
      // user cancelled the picker
    }
  }

  async function toggleShareOff() {
    screenRef.current = null
    await replaceOutgoingVideo(cameraTrackRef.current)
    setSharing(false)
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  const remoteList = Object.entries(remotes)
  const teacher = remoteList[0]
  const students = present.filter((p) => p.role === "attendee")

  return (
    <div className="flex min-h-screen flex-col bg-[#071A14] text-white">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={backHref} className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label={t("lms.leave")}>
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-medium">{topic}</p>
            {courseTitle && <p className="truncate text-xs text-white/60">{localize(courseTitle, locale)}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {phase === "in" && (
            <>
              <span className="flex items-center gap-1.5 text-xs text-white/70">
                <Users className="size-4" />
                {present.length}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                <Radio className="size-3.5 animate-pulse" />
                {t("lms.liveNow")}
              </span>
            </>
          )}
          <div className="hidden opacity-80 sm:block [&_*]:!text-white">
            <Logo />
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center p-4">
        {phase === "in" && (
          <div className="flex h-full w-full max-w-6xl flex-col gap-4">
            {isHost ? (
              students.length === 0 ? (
                <Waiting text={fr ? "En attente des étudiants…" : "Waiting for students…"} />
              ) : (
                <div className={cn("grid flex-1 gap-3", students.length === 1 ? "grid-cols-1" : students.length <= 4 ? "sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-3")}>
                  {students.map((p) => (
                    <VideoTile key={p.peerId} stream={remotes[p.peerId]?.stream ?? null} name={p.name} state={remotes[p.peerId]?.state} />
                  ))}
                </div>
              )
            ) : teacher ? (
              <VideoTile stream={teacher[1].stream} name={teacher[1].name || (fr ? "Formateur" : "Teacher")} state={teacher[1].state} large />
            ) : (
              <Waiting text={fr ? "En attente du formateur…" : "Waiting for the teacher…"} />
            )}

            <div className="absolute bottom-24 right-6 w-40 overflow-hidden rounded-xl bg-black ring-1 ring-white/20 sm:w-56">
              <video ref={selfVideo} autoPlay muted playsInline className={cn("aspect-video w-full object-cover", !sharing && "-scale-x-100")} />
              <span className="absolute bottom-1 left-2 text-[11px] text-white/80">{fr ? "Vous" : "You"}</span>
            </div>

            <div className="mx-auto flex items-center gap-2 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
              <Control on={micOn} onClick={toggleMic} label={micOn ? "Mute" : "Unmute"} icon={micOn ? Mic : MicOff} />
              <Control on={camOn} onClick={toggleCam} label={camOn ? "Camera off" : "Camera on"} icon={camOn ? Camera : CameraOff} />
              {isHost && (
                <Control on={!sharing} onClick={toggleShare} label={fr ? "Partager l'écran" : "Share screen"} icon={MonitorUp} highlight={sharing} />
              )}
              <button
                type="button"
                onClick={leave}
                className="flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium hover:bg-red-500"
              >
                <PhoneOff className="size-4" />
                {t("lms.leave")}
              </button>
              {isHost && (
                <button type="button" onClick={endClass} className="flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium hover:bg-white/20">
                  <Square className="size-4" />
                  {fr ? "Terminer" : "End class"}
                </button>
              )}
            </div>
          </div>
        )}

        {(phase === "left" || phase === "ended") && (
          <div className="text-center">
            <p className="font-heading text-2xl font-semibold">
              {phase === "ended"
                ? fr
                  ? "Ce cours est terminé."
                  : "This class has ended."
                : fr
                  ? "Vous avez quitté le cours"
                  : "You left the class"}
            </p>
            <Button className="mt-6 bg-white text-[#064E3B] hover:bg-emerald-50" render={<Link href={backHref} />}>
              {t("nav.dashboard")}
            </Button>
          </div>
        )}

        {(phase === "lobby" || phase === "joining") && (
          <div className="grid w-full max-w-4xl gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              <video ref={selfVideo} autoPlay muted playsInline className="size-full -scale-x-100 object-cover" />
              {camOk === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/70">
                  <CameraOff className="size-8" />
                  <p className="text-sm">
                    {fr
                      ? "Caméra indisponible. Autorisez la caméra et le micro, ou rejoignez sans."
                      : "Camera unavailable. Allow camera and microphone, or join without them."}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">{isHost ? t("lms.startLive") : t("lms.joinLive")}</p>
              <h1 className="mt-2 font-heading text-2xl font-bold">{topic}</h1>
              <p className="mt-2 text-sm text-white/70">
                {formatDateTime(startAt, locale)} · {durationMin} min
              </p>
              <p className="mt-4 text-sm text-white/60">
                {fr
                  ? "Le cours se déroule ici même, directement dans le navigateur. Votre présence est enregistrée automatiquement."
                  : "The class runs right here in your browser. Your attendance is recorded automatically."}
              </p>
              <Button
                onClick={join}
                disabled={phase === "joining" || camOk === null}
                size="lg"
                className="mt-6 w-full bg-emerald-500 text-[#04140F] hover:bg-emerald-400"
              >
                {phase === "joining" ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
                {isHost ? t("lms.startLive") : t("lms.joinLive")}
              </Button>
              <div className="mt-3">
                <FormError message={error} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/** Autoplay doesn't reliably start for a stream attached after mount, so start playback explicitly. */
function attach(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!video) return
  if (video.srcObject !== stream) video.srcObject = stream
  if (stream) void video.play().catch(() => undefined)
}

function Waiting({ text }: { text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-24 text-white/60">
      <Loader2 className="size-6 animate-spin" />
      {text}
    </div>
  )
}

function VideoTile({ stream, name, state, large }: { stream: MediaStream | null; name: string; state?: RTCPeerConnectionState; large?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => attach(ref.current, stream), [stream])

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10", large ? "aspect-video w-full" : "aspect-video")}>
      <video ref={ref} autoPlay playsInline className="size-full object-cover" data-peer-video={name} />
      {state === "failed" ? (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-red-300">
          Connection failed — retrying…
        </div>
      ) : (
        (!stream || state === "connecting" || state === "new") && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Connecting…
          </div>
        )
      )}
      <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs">{name}</span>
    </div>
  )
}

function Control({
  on,
  onClick,
  label,
  icon: Icon,
  highlight,
}: {
  on: boolean
  onClick: () => void
  label: string
  icon: typeof Mic
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-11 items-center justify-center rounded-xl transition-colors",
        highlight ? "bg-emerald-500 text-[#04140F]" : on ? "bg-white/10 hover:bg-white/20" : "bg-red-500/80 hover:bg-red-500",
      )}
    >
      <Icon className="size-5" />
    </button>
  )
}

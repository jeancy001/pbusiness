import { Circle, Document, G, Image, Page, Path, Polygon, Rect, StyleSheet, Svg, Text, View, pdf } from "@react-pdf/renderer"
import QRCode from "qrcode"

import type { CertificateDoc } from "@/lib/db/lms"
import { CERTIFIER_NAME, certificateGrade } from "@/lib/lms/catalog"

const GREEN = "#064E3B"
const GREEN_SOFT = "#0B6B52"
const GOLD = "#B8893B"
const GOLD_LIGHT = "#D9B26A"
const INK = "#111827"
const MUTED = "#6B7280"
const PAPER = "#FCFBF7"

const s = StyleSheet.create({
  page: { backgroundColor: PAPER, fontFamily: "Helvetica", position: "relative" },
  band: { position: "absolute", top: 14, left: 14, right: 14, bottom: 14, borderWidth: 10, borderColor: GREEN },
  goldOuter: { position: "absolute", top: 30, left: 30, right: 30, bottom: 30, borderWidth: 1.4, borderColor: GOLD },
  goldInner: { position: "absolute", top: 35, left: 35, right: 35, bottom: 35, borderWidth: 0.5, borderColor: GOLD_LIGHT },
  watermark: { position: "absolute", top: 168, left: 311, width: 220, height: 220 },
  content: { position: "absolute", top: 52, left: 92, right: 92, bottom: 50, alignItems: "center" },

  brandRow: { flexDirection: "row", alignItems: "center" },
  brandName: { marginLeft: 9, fontSize: 14, color: INK, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  brandSub: { marginLeft: 9, fontSize: 6.5, letterSpacing: 3, color: GREEN, fontFamily: "Helvetica-Bold" },
  partner: { marginTop: 7, fontSize: 7, letterSpacing: 2.2, color: MUTED },

  title: { marginTop: 24, fontSize: 40, letterSpacing: 7, color: GREEN, fontFamily: "Times-Bold" },
  subtitleRow: { marginTop: 4, flexDirection: "row", alignItems: "center" },
  subtitleRule: { width: 46, height: 0.8, backgroundColor: GOLD },
  subtitle: { marginHorizontal: 10, fontSize: 11, letterSpacing: 5, color: GOLD, fontFamily: "Helvetica-Bold" },
  subtitleFr: { marginTop: 3, fontSize: 7.5, letterSpacing: 1.5, color: MUTED, fontFamily: "Helvetica-Oblique" },

  presented: { marginTop: 26, fontSize: 10, letterSpacing: 1, color: MUTED, fontFamily: "Helvetica-Oblique" },
  name: { marginTop: 6, color: INK, fontFamily: "Times-BoldItalic", textAlign: "center" },
  nameRule: { marginTop: 4, width: 330, height: 0.8, backgroundColor: GOLD },
  body: { marginTop: 16, fontSize: 10.5, color: "#374151", textAlign: "center", lineHeight: 1.5, maxWidth: 560 },
  course: { marginTop: 7, color: GREEN, fontFamily: "Helvetica-Bold", textAlign: "center", maxWidth: 600 },
  result: { marginTop: 9, fontSize: 10, color: "#374151", textAlign: "center" },
  strong: { fontFamily: "Helvetica-Bold", color: INK },

  footer: { marginTop: "auto", width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sigBlock: { width: 190, alignItems: "center" },
  sigName: { fontSize: 13, color: INK, fontFamily: "Times-Italic", marginBottom: 4, textAlign: "center" },
  sigLine: { width: "100%", height: 0.8, backgroundColor: "#9CA3AF", marginBottom: 4 },
  sigRole: { fontSize: 7.5, letterSpacing: 1.2, color: MUTED },
  sealBlock: { alignItems: "center", width: 120 },
  sealGrade: { marginTop: 4, fontSize: 8, letterSpacing: 1.6, color: GOLD, fontFamily: "Helvetica-Bold" },

  strip: { marginTop: 12, width: "100%", flexDirection: "row", alignItems: "center", borderTopWidth: 0.5, borderTopColor: "#E5E1D6", paddingTop: 8 },
  stripCol: { flex: 1 },
  stripLabel: { fontSize: 6, letterSpacing: 1.4, color: MUTED },
  stripValue: { marginTop: 2, fontSize: 8, color: INK, fontFamily: "Helvetica-Bold" },
  qr: { width: 46, height: 46, marginLeft: 12 },
})

/** Gold starburst seal with a green medallion and a check mark. */
function Seal() {
  const points: string[] = []
  for (let i = 0; i < 48; i++) {
    const r = i % 2 === 0 ? 48 : 43
    const a = (Math.PI * i) / 24
    points.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  return (
    <Svg viewBox="0 0 100 100" style={{ width: 82, height: 82 }}>
      <Polygon points={points.join(" ")} fill={GOLD} />
      <Circle cx="50" cy="50" r="39" fill={GOLD_LIGHT} />
      <Circle cx="50" cy="50" r="35" fill={GREEN} />
      <Circle cx="50" cy="50" r="31" fill="none" stroke={GOLD_LIGHT} strokeWidth={1} strokeDasharray="2 2" />
      <Path d="M36 51l9 9 19-21" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/** Brand mark; `faint` draws it in paper tints for the background watermark (react-pdf ignores view opacity). */
function Mark({ size, faint = false }: { size: number; faint?: boolean }) {
  return (
    <Svg viewBox="0 0 48 48" style={{ width: size, height: size }}>
      <Rect width="48" height="48" rx="12" fill={faint ? "#F2F4EF" : GREEN} />
      <Path d="M16 11v17a7 7 0 0 0 7 7h11" fill="none" stroke={faint ? PAPER : "#ffffff"} strokeWidth={5} strokeLinecap="round" />
      <Path d="M24 11h6a7 7 0 0 1 7 7v3" fill="none" stroke={faint ? "#EAF1EB" : "#6EE7B7"} strokeWidth={5} strokeLinecap="round" />
      <Circle cx="37" cy="30.5" r="3.6" fill={faint ? "#F4EEDF" : "#D4A646"} />
    </Svg>
  )
}

/** Gold corner flourish; rotated for each corner. */
function Corner({ style, rotate }: { style: object; rotate: number }) {
  return (
    <Svg viewBox="0 0 60 60" style={{ position: "absolute", width: 44, height: 44, ...style }}>
      <G transform={`rotate(${rotate} 30 30)`}>
        <Path d="M4 40V4h36" fill="none" stroke={GOLD} strokeWidth={2} />
        <Path d="M12 32V12h20" fill="none" stroke={GOLD_LIGHT} strokeWidth={1} />
        <Polygon points="4,4 11,0 18,4 11,8" fill={GOLD} />
        <Circle cx="12" cy="12" r="2.4" fill={GREEN} />
      </G>
    </Svg>
  )
}

/** A4 landscape certificate with a QR code pointing at the public verification page. */
export async function renderCertificatePdf(cert: Pick<CertificateDoc, "code" | "studentName" | "formationTitle" | "teacherName" | "score" | "issuedAt">, verifyUrl: string) {
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 240, color: { dark: GREEN } })
  const issued = cert.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  const grade = certificateGrade(cert.score)
  const course = cert.formationTitle.en
  const nameSize = cert.studentName.length > 34 ? 24 : cert.studentName.length > 24 ? 30 : 36
  const courseSize = course.length > 70 ? 12 : course.length > 45 ? 14 : 17

  const doc = (
    <Document title={`Linko Academy certificate ${cert.code}`} author="Linko Academy" subject={`Certificate — ${course}`}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.band} />
        <View style={s.goldOuter} />
        <View style={s.goldInner} />
        <Corner style={{ top: 40, left: 40 }} rotate={0} />
        <Corner style={{ top: 40, right: 40 }} rotate={90} />
        <Corner style={{ bottom: 40, right: 40 }} rotate={180} />
        <Corner style={{ bottom: 40, left: 40 }} rotate={270} />
        <View style={s.watermark}>
          <Mark size={220} faint />
        </View>

        <View style={s.content}>
          <View style={s.brandRow}>
            <Mark size={30} />
            <View>
              <Text style={s.brandName}>Linko</Text>
              <Text style={s.brandSub}>ACADEMY</Text>
            </View>
          </View>
          <Text style={s.partner}>IN PARTNERSHIP WITH {CERTIFIER_NAME.toUpperCase()}</Text>

          <Text style={s.title}>CERTIFICATE</Text>
          <View style={s.subtitleRow}>
            <View style={s.subtitleRule} />
            <Text style={s.subtitle}>OF ACHIEVEMENT</Text>
            <View style={s.subtitleRule} />
          </View>
          <Text style={s.subtitleFr}>Certificat de réussite</Text>

          <Text style={s.presented}>This is proudly presented to</Text>
          <Text style={[s.name, { fontSize: nameSize }]}>{cert.studentName}</Text>
          <View style={s.nameRule} />

          <Text style={s.body}>for successfully completing all requirements of the course</Text>
          <Text style={[s.course, { fontSize: courseSize }]}>{course}</Text>
          <Text style={s.result}>
            and passing the final certification examination with a score of <Text style={s.strong}>{cert.score}%</Text> —{" "}
            <Text style={s.strong}>{grade.en}</Text>.
          </Text>

          <View style={s.footer}>
            <View style={s.sigBlock}>
              <Text style={s.sigName}>{cert.teacherName ?? "Linko Academy Faculty"}</Text>
              <View style={s.sigLine} />
              <Text style={s.sigRole}>COURSE INSTRUCTOR</Text>
            </View>
            <View style={s.sealBlock}>
              <Seal />
              <Text style={s.sealGrade}>{grade.en.toUpperCase()}</Text>
            </View>
            <View style={s.sigBlock}>
              <Text style={s.sigName}>{CERTIFIER_NAME}</Text>
              <View style={s.sigLine} />
              <Text style={s.sigRole}>CERTIFYING AUTHORITY</Text>
            </View>
          </View>

          <View style={s.strip}>
            <View style={s.stripCol}>
              <Text style={s.stripLabel}>CREDENTIAL ID</Text>
              <Text style={s.stripValue}>{cert.code}</Text>
            </View>
            <View style={s.stripCol}>
              <Text style={s.stripLabel}>DATE OF ISSUE</Text>
              <Text style={s.stripValue}>{issued}</Text>
            </View>
            <View style={[s.stripCol, { flex: 2 }]}>
              <Text style={s.stripLabel}>VERIFY AUTHENTICITY</Text>
              <Text style={[s.stripValue, { color: GREEN_SOFT }]}>{verifyUrl.replace(/^https?:\/\//, "")}</Text>
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qr} style={s.qr} />
          </View>
        </View>
      </Page>
    </Document>
  )

  return pdf(doc).toBlob()
}

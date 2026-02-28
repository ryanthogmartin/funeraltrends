/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for FuneralTrends</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandMark}>☠ Funeral<span style={{ color: '#A4FF00' }}>Trends</span></Text>
          <Text style={brandSub}>powered by DISRUPT Media</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirm email change</Heading>
          <Text style={text}>
            You requested to change your FuneralTrends email from{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text style={text}>
            <Link href={confirmationUrl} style={link}>Click here to confirm this change →</Link>
          </Text>
        </Section>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { maxWidth: '480px', margin: '0 auto', padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '8px' }
const brandMark = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  fontFamily: "'Space Grotesk', Arial, sans-serif",
  color: '#111111',
  margin: '0',
}
const brandSub = { fontSize: '10px', color: '#999999', margin: '0 0 16px', textAlign: 'center' as const }
const card = {
  backgroundColor: '#1F1F1F',
  borderRadius: '12px',
  padding: '32px 28px',
  marginBottom: '16px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  fontFamily: "'Space Grotesk', Arial, sans-serif",
  color: '#ffffff',
  margin: '0 0 16px',
}
const text = {
  fontSize: '14px',
  color: '#BDBDBD',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: '#A4FF00', textDecoration: 'underline' }
const footer = { fontSize: '11px', color: '#999999', textAlign: 'center' as const, margin: '0' }

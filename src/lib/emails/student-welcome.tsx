// emails/student-welcome.tsx
import {
  Html, Head, Body, Container, Heading,
  Text, Section, Hr, Tailwind,
} from "@react-email/components";

interface StudentWelcomeEmailProps {
  name: string;
  email: string;
  password: string;
  collegeName: string;
}

export function StudentWelcomeEmail({ name, email, password, collegeName }: StudentWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-white rounded-2xl p-8 shadow-sm">
              <Heading className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to DHIVI HR 👋
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hi {name}, your account has been set up by {collegeName}. Here are your login details:
              </Text>

              <Hr className="my-4" />

              <Text className="text-sm text-gray-500 mb-1">Email</Text>
              <Text className="font-mono bg-gray-100 rounded px-3 py-2 text-gray-800">{email}</Text>

              <Text className="text-sm text-gray-500 mb-1 mt-4">Temporary Password</Text>
              <Text className="font-mono bg-gray-100 rounded px-3 py-2 text-gray-800">{password}</Text>

              <Hr className="my-6" />

              <Text className="text-xs text-gray-400">
                Please change your password after your first login. If you have any issues, contact your college administrator.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
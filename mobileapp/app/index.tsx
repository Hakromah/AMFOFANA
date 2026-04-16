import { Redirect } from 'expo-router';

// Everyone starts at the public app by default
export default function Index() {
  return <Redirect href={'/(public)' as any} />;
}

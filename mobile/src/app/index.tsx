import { Redirect } from 'expo-router';

// Until real screens exist, the app opens on the primitives gallery.
export default function Index() {
  return <Redirect href="/primitives" />;
}

// supabase-js builds request URLs with the WHATWG URL API, which React Native's own URL only partly implements.
// Native only: the browser has the real thing (see urlPolyfill.ts).
import 'react-native-url-polyfill/auto';

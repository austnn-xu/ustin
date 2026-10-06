import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { recognizer, type CatalogObject, type Interpretation, type MaterialReading } from './engine';
import { classifyImage, loadVision, visionSupported } from './vision';

export type Recognition =
  | { phase: 'idle' }
  | { phase: 'loading'; uri: string; progress: number }
  | { phase: 'thinking'; uri: string }
  | {
      phase: 'done';
      uri: string;
      result: Interpretation;
      /** When nothing was named confidently but the material head has a read: the likely objects. */
      narrowed: { material: MaterialReading; objects: CatalogObject[] } | null;
    }
  | { phase: 'error'; uri: string | null; message: string };

/** Pick or take a photo, then run it through the on-device models. */
export function useRecognition() {
  const [state, setState] = useState<Recognition>({ phase: 'idle' });
  const run = useRef(0);

  const analyse = useCallback(async (uri: string) => {
    const id = ++run.current;
    const alive = () => id === run.current;
    try {
      setState({ phase: 'loading', uri, progress: 0 });
      await loadVision((progress) => alive() && setState({ phase: 'loading', uri, progress }));
      if (!alive()) return;
      setState({ phase: 'thinking', uri });
      const { classes, material } = await classifyImage(uri);
      if (!alive()) return;
      const result = recognizer.interpret(classes, { limit: 4, material });
      const narrowed = !result.recognized && material ? recognizer.byMaterial(material, { ranked: result.ranked, limit: 8 }) : null;
      setState({ phase: 'done', uri, result, narrowed });
    } catch (err) {
      if (!alive()) return;
      setState({
        phase: 'error',
        uri,
        message:
          err instanceof Error && /load|fetch|network/i.test(err.message)
            ? 'I could not download my recognition model. Check your connection, or search instead.'
            : 'Something went wrong reading that photo. Try another, or search instead.',
      });
    }
  }, []);

  const pick = useCallback(
    async (source: 'camera' | 'library') => {
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: false };
      try {
        if (source === 'camera') {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            setState({ phase: 'error', uri: null, message: 'Camera access is off. Upload a photo or search instead.' });
            return;
          }
        }
        const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
        const asset = res.canceled ? null : res.assets[0];
        if (asset) await analyse(asset.uri);
      } catch {
        setState({ phase: 'error', uri: null, message: 'Could not open the camera. Upload a photo or search instead.' });
      }
    },
    [analyse],
  );

  const reset = useCallback(() => {
    run.current += 1;
    setState({ phase: 'idle' });
  }, []);

  return { state, pick, reset, supported: visionSupported };
}

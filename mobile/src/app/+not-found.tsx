import { router } from 'expo-router';
import { View } from 'react-native';
import { MascotSays } from '@/components/MascotSays';
import { Button, Screen } from '@/components/ui';
import { makeStyles } from '@/theme';

/** Any address the app does not know: Tin, and the way home. (Replaces the router's default "Unmatched Route" page.) */
export default function NotFound() {
  const styles = useStyles();
  return (
    <Screen>
      <View style={styles.wrap}>
        <MascotSays mood="thinking" size="lg" layout="above">
          I looked everywhere and that page is not on the route. Let's get you back.
        </MascotSays>
        <Button label="Back to the route" fullWidth onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { flex: 1, justifyContent: 'center', alignSelf: 'stretch', gap: t.space[6] },
}));

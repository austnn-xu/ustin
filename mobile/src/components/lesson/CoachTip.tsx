import { Pointer } from 'lucide-react-native';
import { View } from 'react-native';
import { Appear, Float, Icon, Text } from '@/components/ui';
import { makeStyles } from '@/theme';

/**
 * A coach mark for someone's very first lesson: a blue callout that bobs above the button it is talking about, telling
 * them the one thing to do next. It pops again each time the instruction changes.
 */
export function CoachTip({ children }: { children: string }) {
  const styles = useStyles();
  return (
    <Appear key={children} from="pop" spring="quick" style={styles.wrap}>
      <Float style={styles.tip}>
        <Icon icon={Pointer} size="md" color="onColor" />
        <Text variant="callout" style={styles.text}>
          {children}
        </Text>
        <View style={styles.tail} />
      </Float>
    </Appear>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center', marginBottom: t.space[3] },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[2],
    paddingVertical: t.space[2],
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.hue.blue.base,
  },
  text: { color: t.colors.onColor },
  tail: {
    position: 'absolute',
    bottom: -t.space[1.5],
    left: '50%',
    marginLeft: -t.space[1.5],
    width: t.space[3],
    height: t.space[3],
    backgroundColor: t.colors.hue.blue.base,
    transform: [{ rotate: '45deg' }],
  },
}));

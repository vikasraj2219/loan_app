import { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, typography } from '../../theme/tokens';

const ICONS = {
  Dashboard: 'view-dashboard-outline',
  Borrowers: 'account-group-outline',
  Loans: 'cash-multiple',
  Payments: 'credit-card-outline',
  More: 'dots-horizontal-circle-outline',
};

function TabButton({ route, isFocused, onPress, label }) {
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 9,
      tension: 90,
    }).start();
  }, [isFocused, anim]);

  const pillWidth = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 40 + label.length * 6.4 + 28] });
  const iconColor = isFocused ? colors.white : colors.inkFaint;

  return (
    <Pressable onPress={onPress} style={styles.tabButton} hitSlop={8}>
      <Animated.View style={[styles.pill, { width: pillWidth, backgroundColor: isFocused ? colors.indigo : 'transparent' }]}>
        <MaterialCommunityIcons name={ICONS[route.name]} size={21} color={iconColor} />
        {isFocused && (
          <Animated.Text numberOfLines={1} style={[styles.pillLabel, { opacity: anim }]}>
            {label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // When the focused tab is a nested stack (Borrowers/Loans/Payments/More),
  // only show the floating bar at that stack's root screen — hide it once
  // the user has drilled into a detail/form screen so it never sits on top
  // of content or a submit button. Dashboard has no nested stack, so it's
  // always at "index 0" and the bar always shows there.
  const activeRoute = state.routes[state.index];
  const nestedState = activeRoute.state;
  const isAtNestedRoot = !nestedState || nestedState.index === 0;

  if (!isAtNestedRoot) return null;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return <TabButton key={route.key} route={route} label={label} isFocused={isFocused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.midnight,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    ...shadow.lg,
  },
  tabButton: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  pillLabel: { ...typography.label, color: colors.white, marginLeft: 6 },
});

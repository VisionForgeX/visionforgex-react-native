import React from 'react';
import { Platform, requireNativeComponent, StyleProp, View, ViewStyle } from 'react-native';

type NativeProps = { placement: string; style?: StyleProp<ViewStyle> };

let NativeBanner: React.ComponentType<NativeProps> | null = null;
function native(): React.ComponentType<NativeProps> | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  if (!NativeBanner) NativeBanner = requireNativeComponent<NativeProps>('VfxBannerView');
  return NativeBanner;
}

export interface VfxBannerProps {
  /** The placement's name, as on the platform. */
  placement: string;
  /** The room reserved for it: an anchored adaptive banner is 50–90 tall. Default 60. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** A banner for one placement: adaptive to its width, refreshed as the platform says only while seen. It loads by itself once on screen. */
export function VfxBanner({ placement, height = 60, style }: VfxBannerProps): React.ReactElement | null {
  const Native = native();
  if (!Native) return null;
  return (
    <View style={[{ height, width: '100%' }, style]}>
      <Native placement={placement} style={{ height, width: '100%' }} />
    </View>
  );
}

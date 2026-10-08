/* Toast global (#bp-toast): mensagem flutuante que some após 4 segundos. */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { T, useBreakpoint } from './components';
import { colors, radius, shadow } from '../theme';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { md } = useBreakpoint();

  const show = useCallback((text, opts = {}) => {
    clearTimeout(timer.current);
    setToast({ text, mobile: !!opts.mobile, error: !!opts.error, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    Animated.timing(opacity, { toValue: toast ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  }, [toast, opacity]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const bottom = (toast && toast.mobile && !md ? 80 : 20) + insets.bottom;
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity, justifyContent: 'flex-end', alignItems: toast.mobile ? 'center' : 'flex-end' }]}>
          <Pressable accessibilityRole="alert" onPress={() => setToast(null)} style={[styles.toast, { marginBottom: bottom }, toast.mobile ? styles.mobile : styles.desktop]}>
            {toast.error ? <Icon name="triangle-alert" size={16} color="#ff8a8f" /> : !toast.mobile ? <Icon name="circle-check" size={16} color="#4ade80" /> : null}
            <T style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: toast.mobile ? 400 : 600, flexShrink: 1 }}>{toast.text}</T>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.navy, ...shadow.lg },
  desktop: { marginRight: 20, marginLeft: 20, maxWidth: 480 },
  mobile: { marginHorizontal: 16, alignSelf: 'stretch', maxWidth: 384, width: '92%' },
});

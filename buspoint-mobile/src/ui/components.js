/* Componentes visuais do BusPoint — equivalentes às classes do styles.css do protótipo
   (.btn, .card, .section, .badge, .avatar, .field, .headline, .table, .modal ...). */
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import Icon from './Icon';
import { breakpoints, colors, font, radius, shadow } from '../theme';

/* ---------------- Layout responsivo ---------------- */
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  return {
    width, height,
    sm: width >= breakpoints.sm, md: width >= breakpoints.md, lg: width >= breakpoints.lg, xl: width >= breakpoints.xl,
  };
}

/** Grade com N colunas (substitui display:grid). */
export function Grid({ cols = 1, gap = 16, children, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2, marginBottom: -gap }, style]}>
      {items.map((c, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2, marginBottom: gap }}>{c}</View>
      ))}
    </View>
  );
}

/** Duas colunas com proporção (layout-a/b/c do CSS); empilha quando não há espaço. */
export function Split({ wide, ratio = [1, 1], gap = 20, children }) {
  const [a, b] = React.Children.toArray(children);
  if (!wide) return <View style={{ gap }}>{a}{b}</View>;
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
      <View style={{ flex: ratio[0], minWidth: 0 }}>{a}</View>
      <View style={{ flex: ratio[1], minWidth: 0 }}>{b}</View>
    </View>
  );
}

/* ---------------- Tipografia ---------------- */
/** Text com as fontes do projeto: converte fontWeight na família correta (DM Sans / Sora). */
export function T({ style, display, children, ...rest }) {
  const flat = StyleSheet.flatten([styles.text, style]) || {};
  const { fontWeight, ...others } = flat;
  return <Text {...rest} style={[others, font(Number(fontWeight) || 400, display)]}>{children}</Text>;
}

export const Kicker = ({ children, style, primary }) => <T style={[styles.kicker, primary && { color: colors.primary }, style]}>{children}</T>;
export const SectionTitle = ({ children, style }) => <T display style={[styles.sectionTitle, style]}>{children}</T>;
export const Muted = ({ children, style, ...rest }) => <T {...rest} style={[{ color: colors.mutedForeground, fontSize: 14 }, style]}>{children}</T>;
export const Display = ({ children, style, size = 18 }) => <T display style={[{ fontSize: size, fontWeight: 700, color: colors.foreground }, style]}>{children}</T>;

/* ---------------- Marca ---------------- */
export function Brand({ light }) {
  return (
    <View style={styles.brand}>
      <View style={styles.brandLogo}><Icon name="bus-front" size={20} strokeWidth={2.5} color={colors.primaryForeground} /></View>
      <T display style={[styles.brandName, { color: light ? colors.foreground : colors.primaryForeground }]}>
        Bus<T display style={[styles.brandName, { color: colors.primary }]}>Point</T>
      </T>
    </View>
  );
}

/* ---------------- Botões ---------------- */
const BTN_VARIANT = {
  primary: { bg: colors.primary, fg: colors.primaryForeground, press: colors.primaryHover },
  outline: { bg: colors.background, fg: colors.foreground, press: colors.accent, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.foreground, press: colors.accent },
  secondary: { bg: colors.secondary, fg: colors.foreground, press: '#ebf2fd' },
  destructive: { bg: colors.destructive, fg: colors.primaryForeground, press: '#e04a50' },
};
const BTN_SIZE = { sm: { h: 32, px: 12, fs: 12 }, md: { h: 36, px: 16, fs: 14 }, lg: { h: 40, px: 32, fs: 14 }, tall: { h: 44, px: 16, fs: 14 }, xl: { h: 56, px: 16, fs: 16 }, field: { h: 48, px: 16, fs: 14 } };

export function Button({
  title, onPress, variant = 'primary', size = 'md', icon, iconRight, block, disabled, loading, iconOnly, label, style, color,
}) {
  const v = BTN_VARIANT[variant];
  const s = BTN_SIZE[size];
  const fg = color || v.fg;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || title}
      accessibilityState={{ disabled: !!(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      hitSlop={iconOnly ? 4 : 0}
      style={({ pressed }) => [
        styles.btn,
        { height: s.h, paddingHorizontal: iconOnly ? 0 : s.px, backgroundColor: pressed ? v.press : v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        variant !== 'ghost' && shadow.sm,
        iconOnly && { width: s.h },
        block && { alignSelf: 'stretch' },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={16} color={fg} /> : null}
      {!iconOnly && title ? <T style={{ color: fg, fontSize: s.fs, fontWeight: 500 }} numberOfLines={1}>{title}</T> : null}
      {iconRight ? <Icon name={iconRight} size={16} color={fg} /> : null}
    </Pressable>
  );
}

/** Link textual (.link-more, .back-link, .back-primary) */
export function LinkText({ title, onPress, icon, iconRight, color = colors.primary, size = 12, weight = 700, style }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 }, style]}>
      {icon ? <Icon name={icon} size={size + 2} color={color} /> : null}
      <T style={{ color, fontSize: size, fontWeight: weight }}>{title}</T>
      {iconRight ? <Icon name={iconRight} size={size} color={color} /> : null}
    </Pressable>
  );
}

/* ---------------- Cartões e seções ---------------- */
export const Card = ({ children, style, pad }) => (
  <View style={[styles.card, pad === 'lg' ? { padding: 24 } : pad ? { padding: 20 } : null, style]}>{children}</View>
);

export function Section({ title, aside, children, style }) {
  return (
    <View style={[styles.card, { overflow: 'hidden' }, style]}>
      <View style={styles.sectionHead}>
        <SectionTitle style={{ flexShrink: 1 }}>{title}</SectionTitle>
        {aside}
      </View>
      {children}
    </View>
  );
}

export const Divide = ({ children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  return <View>{items.map((c, i) => <View key={i} style={i ? { borderTopWidth: 1, borderTopColor: colors.border } : null}>{c}</View>)}</View>;
};

/* ---------------- Badge, avatar, ícones ---------------- */
export function badgeTone(value) {
  const v = String(value);
  if (/Ativ|andamento|Embarcado|Aprovad|Concluíd|Desembarcado/.test(v) && !/Inativ/.test(v)) return { bg: colors.softGreen, fg: colors.success };
  if (/Pendente|Aguardando|Manutenção/.test(v)) return { bg: colors.softYellow, fg: colors.warning };
  if (/Inativ|Cancelad|Erro|Recusad|Invalidad/.test(v)) return { bg: colors.softRed, fg: colors.destructive };
  return { bg: colors.surfaceBlue, fg: colors.primary };
}

export function Badge({ value, style }) {
  const t = badgeTone(value);
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <View style={[styles.badgeDot, { backgroundColor: t.fg }]} />
      <T style={{ color: t.fg, fontSize: 11, fontWeight: 700 }} numberOfLines={1}>{value}</T>
    </View>
  );
}

export function Avatar({ initials, lg, uri, size }) {
  const d = size || (lg ? 64 : 36);
  if (uri) return <Image source={{ uri }} style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: colors.surfaceBlue }} accessibilityIgnoresInvertColors />;
  return (
    <View style={[styles.avatar, { width: d, height: d, borderRadius: d / 2 }]}>
      <T style={{ color: colors.primary, fontSize: lg ? 20 : 12, fontWeight: 700 }}>{initials}</T>
    </View>
  );
}

export function IconTile({ name, size = 'md', color = colors.primary, bg = colors.surfaceBlue }) {
  const d = size === 'sm' ? 36 : size === 'xl' ? 56 : 40;
  const i = size === 'sm' ? 16 : size === 'xl' ? 32 : 20;
  return <View style={{ width: d, height: d, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={name} size={i} color={color} /></View>;
}

export const Dot = ({ tone = 'primary', style }) => (
  <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.primary }, style]} />
);

/* ---------------- Formulários ---------------- */
export const Label = ({ children }) => <T style={styles.label}>{children}</T>;

export function Input({ value, onChangeText, placeholder, type = 'text', icon, multiline, style, inputStyle, right, editable = true, autoFocus, onSubmitEditing, label, maxLength }) {
  const [focus, setFocus] = useState(false);
  const kb = { email: 'email-address', tel: 'phone-pad', number: 'number-pad', time: 'number-pad', date: 'number-pad', numeric: 'number-pad' }[type] || 'default';
  return (
    <View style={[{ position: 'relative', justifyContent: 'center' }, style]}>
      {icon ? <View style={styles.inputIcon} pointerEvents="none"><Icon name={icon} size={16} color={colors.mutedForeground} /></View> : null}
      <TextInput
        accessibilityLabel={label || placeholder}
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={kb}
        secureTextEntry={type === 'password'}
        autoCapitalize={['email', 'password', 'login'].includes(type) ? 'none' : 'sentences'}
        autoCorrect={!['email', 'password', 'login'].includes(type)}
        multiline={multiline}
        editable={editable}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onSubmitEditing={onSubmitEditing}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[
          styles.input, font(400),
          multiline && { minHeight: 112, paddingTop: 12, paddingBottom: 12 },
          icon && { paddingLeft: 36 },
          right && { paddingRight: 44 },
          focus && styles.inputFocus,
          !editable && { backgroundColor: colors.muted },
          inputStyle,
        ]}
      />
      {right ? <View style={{ position: 'absolute', right: 4 }}>{right}</View> : null}
    </View>
  );
}

/** Seletor (substitui <select>): abre uma lista de opções em modal. */
export function Select({ value, options, onChange, icon, placeholder = 'Selecione', label, style }) {
  const [open, setOpen] = useState(false);
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }));
  const atual = opts.find((o) => o.value === value);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={label || placeholder} onPress={() => setOpen(true)} style={[styles.input, styles.selectBox, icon && { paddingLeft: 36 }, style]}>
        {icon ? <View style={[styles.inputIcon, { top: 11 }]}><Icon name={icon} size={16} color={colors.mutedForeground} /></View> : null}
        <T style={{ flex: 1, fontSize: 14, color: atual ? colors.foreground : colors.mutedForeground }} numberOfLines={1}>{atual ? atual.label : placeholder}</T>
        <Icon name="chevron-down" size={16} color={colors.mutedForeground} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.modal, { padding: 8, maxHeight: '80%' }]} onPress={() => {}}>
            {label ? <Kicker style={{ paddingHorizontal: 8, paddingVertical: 8 }}>{label}</Kicker> : null}
            <ScrollView>
              {opts.map((o) => {
                const on = o.value === value;
                return (
                  <Pressable key={String(o.value)} onPress={() => { setOpen(false); onChange(o.value); }} style={({ pressed }) => [styles.option, on && { backgroundColor: colors.surfaceBlue }, pressed && !on && { backgroundColor: colors.muted }]}>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontSize: 14, fontWeight: on ? 700 : 500, color: on ? colors.primary : colors.foreground }}>{o.label}</T>
                      {o.sub ? <T style={{ fontSize: 11, color: colors.mutedForeground }}>{o.sub}</T> : null}
                    </View>
                    {on ? <Icon name="check" size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function Field({ label, error, children, style }) {
  return (
    <View style={style}>
      <Label>{label}</Label>
      {children}
      {error ? <T style={{ marginTop: 6, fontSize: 12, color: colors.destructive }}>{error}</T> : null}
    </View>
  );
}

/* ---------------- Cabeçalhos e estados ---------------- */
export function Headline({ eyebrow, title, description, action }) {
  const { md } = useBreakpoint();
  return (
    <View style={styles.headline}>
      <View style={{ flexShrink: 1, minWidth: 200 }}>
        {eyebrow ? <Kicker style={{ marginBottom: 8 }}>{eyebrow}</Kicker> : null}
        <T display style={{ fontSize: md ? 29 : 25, lineHeight: md ? 36 : 31, fontWeight: 700 }}>{title}</T>
        {description ? <Muted style={{ marginTop: 6 }}>{description}</Muted> : null}
      </View>
      {action}
    </View>
  );
}

export function Empty({ text = 'Nenhum resultado encontrado.', icon = 'search' }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={28} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
      <Muted style={{ textAlign: 'center', paddingHorizontal: 16 }}>{text}</Muted>
    </View>
  );
}

export function Loading({ text = 'Carregando...' }) {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.primary} />
      <Muted>{text}</Muted>
    </View>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <View style={styles.empty}>
      <Icon name="triangle-alert" size={28} color={colors.destructive} />
      <Muted style={{ textAlign: 'center', paddingHorizontal: 16 }}>{error}</Muted>
      {onRetry ? <Button title="Tentar novamente" variant="outline" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}

export const KvRow = ({ k, v, style, children }) => (
  <View style={[styles.kvRow, style]}>
    {typeof k === 'string' ? <Muted>{k}</Muted> : k}
    {children || <T style={{ fontSize: 14, fontWeight: 700, flexShrink: 1, textAlign: 'right' }}>{v}</T>}
  </View>
);

export const Stack = ({ gap = 16, children, style }) => <View style={[{ gap }, style]}>{children}</View>;

export const Row = ({ gap = 16, children, style, wrap = true }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>
);

/** Lista ordenada de pontos de parada (.stops) */
export function StopList({ stops, active = -1, activeLabel = 'Próximo ponto' }) {
  if (!stops.length) return <Muted style={{ fontSize: 12 }}>Nenhum ponto cadastrado.</Muted>;
  return (
    <View>
      {stops.map((s, i) => (
        <View key={`${s}-${i}`} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.stopNum, i === active && { backgroundColor: colors.primary }]}>
              <T style={{ fontSize: 12, fontWeight: 700, color: i === active ? colors.primaryForeground : colors.primary }}>{i + 1}</T>
            </View>
            {i < stops.length - 1 ? <View style={{ flex: 1, width: 1, minHeight: 32, backgroundColor: colors.border }} /> : null}
          </View>
          <View style={{ paddingTop: 4, paddingBottom: 24, flex: 1 }}>
            <T style={{ fontSize: 14, fontWeight: 600 }}>{s}</T>
            {i === active ? <T style={{ fontSize: 11, color: colors.primary }}>{activeLabel}</T> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ---------------- Tabela ---------------- */
/** Tabela com rolagem horizontal (.table-scroll). columns: [{ label, width, render(row) }] */
export function Table({ columns, rows, onRowPress, keyOf = (r, i) => i }) {
  const total = columns.reduce((s, c) => s + (c.width || 140), 0);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ minWidth: total, flexGrow: 1 }}>
        <View style={[styles.tr, { backgroundColor: colors.muted }]}>
          {columns.map((c) => (
            <View key={c.label} style={[styles.th, { width: c.width || 140, flexGrow: c.grow ? 1 : 0 }]}>
              <T style={styles.thText} numberOfLines={1}>{c.label}</T>
            </View>
          ))}
        </View>
        {rows.map((r, i) => {
          const cells = columns.map((c) => (
            <View key={c.label} style={[styles.td, { width: c.width || 140, flexGrow: c.grow ? 1 : 0 }]}>
              {(() => {
                const v = c.render(r);
                return typeof v === 'string' || typeof v === 'number' ? <T style={[{ fontSize: 13, color: c.strong ? colors.foreground : colors.mutedForeground }, c.strong && { fontWeight: 600 }]} numberOfLines={1}>{v}</T> : v;
              })()}
            </View>
          ));
          return onRowPress ? (
            <Pressable key={keyOf(r, i)} onPress={() => onRowPress(r)} style={({ pressed }) => [styles.tr, styles.trBody, pressed && { backgroundColor: colors.background }]}>{cells}</Pressable>
          ) : (
            <View key={keyOf(r, i)} style={[styles.tr, styles.trBody]}>{cells}</View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ---------------- Modal ---------------- */
export function AppModal({ visible, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar">
        <Pressable style={[styles.modal, { padding: 24 }]} onPress={() => {}} accessibilityViewIsModal>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const ModalActions = ({ children }) => <View style={styles.formActions}>{children}</View>;

export const styles = StyleSheet.create({
  text: { color: colors.foreground, fontSize: 16 },
  kicker: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.3, fontWeight: 800, color: colors.mutedForeground },
  sectionTitle: { fontSize: 15, fontWeight: 700 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 20, fontWeight: 700 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceBlue },
  label: { fontSize: 12, fontWeight: 700, marginBottom: 7 },
  input: { minHeight: 40, paddingHorizontal: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.foreground, fontSize: 14 },
  inputFocus: { borderColor: colors.primary },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  selectBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.md },
  headline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 64 },
  kvRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stopNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceBlue, alignItems: 'center', justifyContent: 'center' },
  tr: { flexDirection: 'row' },
  trBody: { borderTopWidth: 1, borderTopColor: colors.line },
  th: { paddingHorizontal: 18, paddingVertical: 13 },
  thText: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.55, color: colors.mutedForeground, fontWeight: 700 },
  td: { paddingHorizontal: 18, paddingVertical: 15, justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 384, borderRadius: radius.lg, backgroundColor: colors.card, ...shadow.lg },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 24 },
});

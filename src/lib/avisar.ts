import { Alert, Platform } from 'react-native';

/** Mensaje simple que funciona en celular y en la vista previa web. */
export function avisar(titulo: string, mensaje: string) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensaje}`);
  } else {
    Alert.alert(titulo, mensaje);
  }
}

export function confirmar(titulo: string, mensaje: string, accion: string, alConfirmar: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensaje}`)) alConfirmar();
  } else {
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: accion, style: 'destructive', onPress: alConfirmar },
    ]);
  }
}

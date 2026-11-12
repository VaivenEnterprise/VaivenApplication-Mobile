import type { ItemFormValues } from '@/features/items/schemas';

// Borrador del formulario de publicar (RNF-01): vive solo en memoria de la sesión, así que volver
// atrás no pierde lo escrito, pero nada se guarda en disco (Art. VI). Las fotos no forman parte del
// borrador: sus subidas se cancelan al salir de la pantalla.

let draft: ItemFormValues | null = null;

export const getDraft = (): ItemFormValues | null => draft;
export const saveDraft = (values: ItemFormValues): void => {
  draft = values;
};
export const clearDraft = (): void => {
  draft = null;
};

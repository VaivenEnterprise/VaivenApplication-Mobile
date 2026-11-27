// Spec 021-T008: `AccessibilityInfo.isReduceMotionEnabled()` de prueba. Devuelve algo que se puede
// encadenar con `.then(...)` y que entrega el valor de inmediato: el `setState` del componente
// ocurre dentro del `act` que ya está abierto al montar, en vez de en una promesa que se resuelve
// después y dispara «not wrapped in act».
export const reduceMotionSync = (value: boolean) => () =>
  ({
    then: (onValue: (v: boolean) => unknown) => {
      onValue(value);
      return Promise.resolve();
    },
  }) as unknown as Promise<boolean>;

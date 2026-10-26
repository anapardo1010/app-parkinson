import {
  calcularAdherencia,
  clasificar,
  contarMotivos,
  DosisConEstado,
  estadoDelDia,
} from '@/features/adherencia/calculo';

const dosis = (programada: string, estado: DosisConEstado['estado'], horaReal: string | null = null, motivo: string | null = null): DosisConEstado => ({
  id: programada,
  programada,
  estado,
  horaReal,
  motivo,
});

describe('cálculo de adherencia', () => {
  const ahora = '2026-10-20T23:00';

  it('cuenta tomadas a tiempo y tarde como tomadas', () => {
    const r = calcularAdherencia(
      [
        dosis('2026-10-20T08:00', 'tomada', '2026-10-20T08:05'),
        dosis('2026-10-20T14:00', 'tarde', '2026-10-20T15:30'),
        dosis('2026-10-20T20:00', 'no_tomada', null, 'olvido'),
        dosis('2026-10-20T22:00', null),
      ],
      ahora,
    );
    expect(r.programadas).toBe(4);
    expect(r.tomadas).toBe(2);
    expect(r.porcentaje).toBe(50);
    expect(r.puntuales).toBe(1);
    expect(r.puntualidad).toBe(25);
    expect(r.clasificacion).toBe('parcial');
  });

  it('ignora las dosis que todavía no debían tomarse', () => {
    const r = calcularAdherencia([dosis('2026-10-20T08:00', 'tomada'), dosis('2026-10-21T08:00', null)], ahora);
    expect(r.programadas).toBe(1);
    expect(r.porcentaje).toBe(100);
  });

  it('una toma registrada como "tomada" pero fuera de la ventana no es puntual', () => {
    const r = calcularAdherencia([dosis('2026-10-20T08:00', 'tomada', '2026-10-20T08:45')], ahora);
    expect(r.porcentaje).toBe(100);
    expect(r.puntualidad).toBe(0);
  });

  it('sin dosis pasadas no hay porcentaje', () => {
    expect(calcularAdherencia([], ahora)).toMatchObject({ porcentaje: null, clasificacion: 'sin_datos' });
  });

  it('clasifica con los umbrales 80 y 50', () => {
    expect(clasificar(80)).toBe('buena');
    expect(clasificar(79)).toBe('parcial');
    expect(clasificar(50)).toBe('parcial');
    expect(clasificar(49)).toBe('baja');
  });
});

describe('estado del día en el calendario', () => {
  const ahora = '2026-10-20T23:00';
  it('completo si todas se tomaron a tiempo', () => {
    expect(estadoDelDia([dosis('2026-10-20T08:00', 'tomada'), dosis('2026-10-20T20:00', 'tomada')], ahora)).toBe('completo');
  });
  it('parcial si alguna fue tarde o faltó', () => {
    expect(estadoDelDia([dosis('2026-10-20T08:00', 'tomada'), dosis('2026-10-20T20:00', 'tarde')], ahora)).toBe('parcial');
    expect(estadoDelDia([dosis('2026-10-20T08:00', 'tomada'), dosis('2026-10-20T20:00', null)], ahora)).toBe('parcial');
  });
  it('omitido si no se tomó ninguna', () => {
    expect(estadoDelDia([dosis('2026-10-20T08:00', 'no_tomada'), dosis('2026-10-20T20:00', null)], ahora)).toBe('omitido');
  });
  it('sin datos si el día no ha llegado', () => {
    expect(estadoDelDia([dosis('2026-10-21T08:00', null)], ahora)).toBe('sin_datos');
  });
});

it('cuenta los motivos de omisión', () => {
  expect(
    contarMotivos([
      dosis('a', 'no_tomada', null, 'olvido'),
      dosis('b', 'no_tomada', null, 'olvido'),
      dosis('c', 'no_tomada', null, 'efectos'),
      dosis('d', 'tomada'),
    ]),
  ).toEqual({ olvido: 2, efectos: 1 });
});

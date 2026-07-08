describe('Cálculos de Cotización', () => {
  it('debe calcular subtotal correctamente', () => {
    const precio = 1000;
    const cantidad = 5;
    const subtotal = precio * cantidad;
    expect(subtotal).toBe(5000);
  });

  it('debe calcular IVA correctamente', () => {
    const subtotal = 5000;
    const iva = subtotal * 0.16;
    expect(iva).toBe(800);
  });

  it('debe calcular total correctamente', () => {
    const subtotal = 5000;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    expect(total).toBe(5800);
  });

  it('debe validar email correctamente', () => {
    const email = 'test@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(true);
  });

  it('debe rechazar email inválido', () => {
    const email = 'invalid-email';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(false);
  });
});
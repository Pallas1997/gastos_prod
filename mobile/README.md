# Mis gastos — app para celular (Expo)

La misma app que la versión web, hecha con React Native + Expo. Usa el mismo backend y la misma cuenta, así que tus datos se ven en los dos lados.

```
mobile/
├── App.js              → barra superior, pestañas y navegación
├── src/config.js       → URL del backend
├── src/ui.js           → componentes visuales, colores y diálogos
├── src/graphics.js     → anillo del mes, carrito pixel art y barra de reparto
├── src/AddSheet.js     → hoja para cargar un gasto
├── src/lib/            → datos (store), formato de números, dólar, cuenta y archivos
└── src/screens/        → Inicio, Ingresos, Gastos, Servicios y Súper
```

## Probarla en el iPhone sin instalar nada (Expo Snack)

1. Instalá **Expo Go** desde el App Store.
2. Entrá a https://snack.expo.dev, tocá el ícono de importar (arriba) → **Import git repository** y pegá:
   `https://github.com/Pallas1997/gastos_prod/tree/main/mobile`
3. Tocá **My Device**, escaneá el QR con la cámara del iPhone y se abre en Expo Go.

## Correrla desde tu computadora (opcional)

Necesitás Node.js 18 o más nuevo.

```bash
cd mobile
npm install
npx expo start
```

Escaneá el QR que aparece en la terminal con la cámara del iPhone.

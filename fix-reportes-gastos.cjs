const fs = require('fs');

let js = fs.readFileSync('frontend/js/reportes.js', 'utf8');

const regex = /function renderGastosDescripcionTipo\(data\) \{[\s\S]*?graficoGastosDescripcionTipo = new Chart\(ctx, \{[\s\S]*?plugins: \[ChartDataLabels\],\s*\}\);\s*\}/;

const dynamicFunction = `function renderGastosDescripcionTipo(data) {
  const ctx = document.getElementById("graficoGastosDescripcionTipo").getContext("2d");

  if (graficoGastosDescripcionTipo) graficoGastosDescripcionTipo.destroy();

  if (!data || data.length === 0) {
    setDescripcion(".app-gastos", "No hay datos de gastos en este período.");
    return;
  }

  const descripciones = [...new Set(data.map((d) => d.descripcion))];
  const tipos = [...new Set(data.map((d) => d.tipo || "Sin tipo"))];

  const datasets = tipos.map((tipo, index) => {
    const valores = descripciones.map((desc) => {
      const r = data.find((d) => d.descripcion === desc && (d.tipo || "Sin tipo") === tipo);
      return r ? Number(r.importe) : 0;
    });

    return {
      label: tipo,
      data: valores,
      backgroundColor: paletaColores[index % paletaColores.length],
    };
  });

  const gastoTop = data.reduce((a, b) =>
    Number(a.importe) > Number(b.importe) ? a : b
  );

  setDescripcion(
    ".app-gastos",
    \`Este gráfico muestra la distribución de los gastos según su descripción y tipo. El gasto más alto corresponde a "\${gastoTop.descripcion}", de tipo \${gastoTop.tipo}, con un importe total de \${formatoPesos.format(gastoTop.importe)}.\`
  );

  graficoGastosDescripcionTipo = new Chart(ctx, {
    type: "bar",
    data: {
      labels: descripciones,
      datasets: datasets,
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (context) =>
              \`\${context.dataset.label}: \${formatoPesos.format(context.parsed.y)}\`,
          },
        },
        datalabels: {
          display: true,
          color: "#1e293b",
          anchor: "end",
          align: "top",
          formatter: (value) =>
            value > 0 ? formatoPesos.format(value) : "",
        },
      },
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: "Descripción del gasto" },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: "Importe total" },
          ticks: {
            callback: (value) => formatoPesos.format(value),
          },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}`;

if (regex.test(js)) {
  js = js.replace(regex, dynamicFunction);
  fs.writeFileSync('frontend/js/reportes.js', js);
  console.log('Fixed renderGastosDescripcionTipo to be fully dynamic');
} else {
  console.log('Could not find the function to replace using regex!');
}

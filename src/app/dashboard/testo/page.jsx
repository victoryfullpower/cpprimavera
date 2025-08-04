'use client';
// Este componente hace TODO: obtiene datos, exporta PDF y Excel en una sola página
import { useEffect, useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginBottom: 5, padding: 5, borderBottom: '1px solid #eee' },
});

export default function AllInOneReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Obtener datos de Prisma via API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/clientes'); // Endpoint que usa Prisma
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Componente PDF integrado (sin archivo separado)
  const MyPDF = () => (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>Reporte de Ventas</Text>
        {data.map((item) => (
          <View key={item.idcliente} style={styles.row}>
            <Text>{item.nombre}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  // 3. Exportar a Excel
  const exportExcel = () => {
    if (data.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, "reporte_ventas.xlsx");
  };

  if (loading) return <div>Cargando datos...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-6">Generador de Reportes</h1>
      
      {/* Botones de exportación */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={data.length === 0}
        >
          Exportar Excel
        </button>
        
        <PDFDownloadLink
          document={<MyPDF />}
          fileName="reporte_ventas.pdf"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {({ loading }) => (loading ? 'Generando PDF...' : 'Exportar PDF')}
        </PDFDownloadLink>
      </div>

      {/* Vista previa de datos (opcional) */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl mb-4">Datos actuales ({data.length} registros)</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.idcliente}</td>
                <td className="p-2">{item.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
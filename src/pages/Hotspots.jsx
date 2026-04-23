import ModuleCrudPage from '../components/ModuleCrudPage'

export default function Hotspots() {
  return (
    <ModuleCrudPage
      title="Hotspots"
      subtitle="Gestion de hotspots y portales cautivos."
      endpoint="/hotspots"
      keyField="id"
      fields={[
        { name: 'name', label: 'Nombre', required: true, placeholder: 'Hotspot-Centro' },
        { name: 'nas_id', label: 'NAS ID', type: 'number', placeholder: '1' },
        { name: 'location', label: 'Ubicacion', placeholder: 'Sucursal Centro' },
        { name: 'status', label: 'Estado', placeholder: 'active' },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nombre' },
        { key: 'location', label: 'Ubicacion' },
        { key: 'status', label: 'Estado' },
      ]}
    />
  )
}
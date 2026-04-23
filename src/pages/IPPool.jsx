import ModuleCrudPage from '../components/ModuleCrudPage'

export default function IPPool() {
  return (
    <ModuleCrudPage
      title="IP Pool"
      subtitle="Pools de direcciones para asignacion dinamica."
      endpoint="/ip-pool"
      keyField="id"
      fields={[
        { name: 'name', label: 'Nombre Pool', required: true, placeholder: 'pool-hotspot' },
        { name: 'start_ip', label: 'IP Inicio', required: true, placeholder: '10.10.10.10' },
        { name: 'end_ip', label: 'IP Fin', required: true, placeholder: '10.10.10.250' },
        { name: 'nas_id', label: 'NAS ID', type: 'number', placeholder: '1' },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Pool' },
        { key: 'start_ip', label: 'Inicio' },
        { key: 'end_ip', label: 'Fin' },
      ]}
    />
  )
}
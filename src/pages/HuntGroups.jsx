import ModuleCrudPage from '../components/ModuleCrudPage'

export default function HuntGroups() {
  return (
    <ModuleCrudPage
      title="Hunt Groups"
      subtitle="Reglas de match para origen y acceso."
      endpoint="/hunt-groups"
      keyField="id"
      fields={[
        { name: 'name', label: 'Nombre', required: true, placeholder: 'HG-SucursalNorte' },
        { name: 'attribute', label: 'Atributo', required: true, placeholder: 'NAS-IP-Address' },
        { name: 'op', label: 'Operador', required: true, placeholder: '==' },
        { name: 'value', label: 'Valor', required: true, placeholder: '192.168.1.10' },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nombre' },
        { key: 'attribute', label: 'Atributo' },
        { key: 'value', label: 'Valor' },
      ]}
    />
  )
}
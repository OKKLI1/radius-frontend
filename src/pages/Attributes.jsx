import ModuleCrudPage from '../components/ModuleCrudPage'

export default function Attributes() {
  return (
    <ModuleCrudPage
      title="Attributes"
      subtitle="Editor de atributos RADIUS por entidad."
      endpoint="/attributes"
      keyField="uid"
      fields={[
        { name: 'scope', label: 'Scope', required: true, placeholder: 'user|group' },
        { name: 'target', label: 'Target', required: true, placeholder: 'jlopez|empleados' },
        { name: 'attribute', label: 'Atributo', required: true, placeholder: 'Mikrotik-Rate-Limit' },
        { name: 'op', label: 'Operador', required: true, placeholder: ':=' },
        { name: 'value', label: 'Valor', required: true, placeholder: '10M/10M' },
      ]}
      columns={[
        { key: 'uid', label: 'ID' },
        { key: 'scope', label: 'Scope' },
        { key: 'target', label: 'Target' },
        { key: 'attribute', label: 'Atributo' },
        { key: 'value', label: 'Valor' },
      ]}
    />
  )
}

import ModuleCrudPage from '../components/ModuleCrudPage'

export default function RealmProxy() {
  return (
    <ModuleCrudPage
      title="Realm / Proxy"
      subtitle="Definicion de realms y servidores proxy."
      endpoint="/realm-proxy"
      keyField="id"
      fields={[
        { name: 'realm', label: 'Realm', required: true, placeholder: 'empresa.cl' },
        { name: 'server', label: 'Servidor', required: true, placeholder: '10.0.0.5' },
        { name: 'port', label: 'Puerto', type: 'number', defaultValue: 1812, placeholder: '1812' },
        { name: 'secret', label: 'Secret', required: true, placeholder: 'sharedsecret' },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'realm', label: 'Realm' },
        { key: 'server', label: 'Servidor' },
        { key: 'port', label: 'Puerto' },
      ]}
    />
  )
}
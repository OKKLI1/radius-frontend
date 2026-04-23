import ModuleCrudPage from '../components/ModuleCrudPage'

export default function UserGroups() {
  return (
    <ModuleCrudPage
      title="User Groups"
      subtitle="Asignacion de usuarios a grupos RADIUS."
      endpoint="/user-groups"
      keyField="id"
      fields={[
        { name: 'username', label: 'Usuario', required: true, placeholder: 'jlopez' },
        { name: 'groupname', label: 'Grupo', required: true, placeholder: 'empleados' },
        { name: 'priority', label: 'Prioridad', type: 'number', defaultValue: 1, placeholder: '1' },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'username', label: 'Usuario' },
        { key: 'groupname', label: 'Grupo' },
        { key: 'priority', label: 'Prioridad' },
      ]}
    />
  )
}
export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '学生管理' })
  : { navigationBarTitleText: '学生管理' }
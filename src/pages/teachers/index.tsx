import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect, useCallback } from 'react';
import { Network } from '@/network';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react-taro';
import Taro from '@tarojs/taro';

interface Teacher {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
}

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBio, setFormBio] = useState('');

  const loadTeachers = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/teachers' });
      console.log('load teachers:', res.data);
      setTeachers(res.data?.data || []);
    } catch (e) {
      console.error('加载教师失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  const openAdd = () => {
    setEditId(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormBio('');
    setShowDialog(true);
  };

  const openEdit = (t: Teacher) => {
    setEditId(t.id);
    setFormName(t.name);
    setFormPhone(t.phone || '');
    setFormEmail(t.email || '');
    setFormBio(t.bio || '');
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入教师姓名', icon: 'none' });
      return;
    }
    try {
      const url = editId ? `/api/teachers/${editId}` : '/api/teachers';
      const method = editId ? 'PUT' as const : 'POST' as const;
      const res = await Network.request({
        url,
        method,
        data: {
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          bio: formBio.trim() || undefined,
        },
      });
      console.log('save teacher:', res.data);
      setShowDialog(false);
      Taro.showToast({ title: editId ? '更新成功' : '添加成功', icon: 'success' });
      await loadTeachers();
    } catch (e) {
      console.error('保存教师失败:', e);
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await Network.request({ url: `/api/teachers/${id}`, method: 'DELETE' });
      Taro.showToast({ title: '已删除', icon: 'success' });
      await loadTeachers();
    } catch (e) {
      console.error('删除教师失败:', e);
    }
  };

  return (
    <View className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex flex-row items-center justify-between shadow-sm">
        <Text className="block text-lg font-bold text-slate-900">教师管理</Text>
        <Button size="sm" className="bg-indigo-600" onClick={openAdd}>
          <Plus size={16} color="#fff" />
          <Text className="block text-white text-sm ml-1">添加教师</Text>
        </Button>
      </View>

      <ScrollView className="flex-1 px-4 pt-3 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-slate-400">加载中...</Text>
          </View>
        ) : teachers.length === 0 ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-slate-400">暂无教师，点击右上角添加</Text>
          </View>
        ) : (
          teachers.map((t) => (
            <Card key={t.id} className="mb-3">
              <CardContent className="p-4">
                <View className="flex flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="block text-base font-semibold text-slate-900">{t.name}</Text>
                    {t.phone && <Text className="block text-sm text-slate-500 mt-1">电话 {t.phone}</Text>}
                    {t.email && <Text className="block text-sm text-slate-500">邮箱 {t.email}</Text>}
                    {t.bio && <Text className="block text-sm text-slate-400 mt-1">{t.bio}</Text>}
                  </View>
                  <View className="flex flex-row gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Pencil size={16} color="#64748B" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 size={16} color="#EF4444" />
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      {/* 添加/编辑弹窗 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="block text-lg font-semibold">{editId ? '编辑教师' : '添加教师'}</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="flex flex-col gap-4 py-2 overflow-y-auto max-h-[70vh]">
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">姓名 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="输入教师姓名"
                  value={formName}
                  onInput={(e) => setFormName(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">电话</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="选填"
                  value={formPhone}
                  onInput={(e) => setFormPhone(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">邮箱</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="选填"
                  value={formEmail}
                  onInput={(e) => setFormEmail(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">简介</Text>
              <View className="bg-gray-50 rounded-2xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: 60, backgroundColor: 'transparent', fontSize: '14px' }}
                  placeholder="选填，教师简介"
                  value={formBio}
                  onInput={(e) => setFormBio(e.detail.value)}
                />
              </View>
            </View>
            <Button className="w-full bg-indigo-600" onClick={handleSubmit}>
              <Text className="block text-white font-medium">{editId ? '保存修改' : '确认添加'}</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
};

export default TeachersPage;
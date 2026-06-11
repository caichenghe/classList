import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect, useCallback } from 'react';
import { Network } from '@/network';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react-taro';
import Taro from '@tarojs/taro';

interface Student {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  parent_name: string | null;
  level: string | null;
  notes: string | null;
}

const levels = ['初级', '中级', '高级'];

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formParent, setFormParent] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const loadStudents = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/students' });
      console.log('load students:', res.data);
      setStudents(res.data?.data || []);
    } catch (e) {
      console.error('加载学生失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const openAdd = () => {
    setEditId(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormParent('');
    setFormLevel('');
    setFormNotes('');
    setShowDialog(true);
  };

  const openEdit = (s: Student) => {
    setEditId(s.id);
    setFormName(s.name);
    setFormPhone(s.phone || '');
    setFormEmail(s.email || '');
    setFormParent(s.parent_name || '');
    setFormLevel(s.level || '');
    setFormNotes(s.notes || '');
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入学生姓名', icon: 'none' });
      return;
    }
    try {
      const url = editId ? `/api/students/${editId}` : '/api/students';
      const method = editId ? 'PUT' as const : 'POST' as const;
      const res = await Network.request({
        url,
        method,
        data: {
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          parent_name: formParent.trim() || undefined,
          level: formLevel || undefined,
          notes: formNotes.trim() || undefined,
        },
      });
      console.log('save student:', res.data);
      setShowDialog(false);
      Taro.showToast({ title: editId ? '更新成功' : '添加成功', icon: 'success' });
      await loadStudents();
    } catch (e) {
      console.error('保存学生失败:', e);
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await Network.request({ url: `/api/students/${id}`, method: 'DELETE' });
      Taro.showToast({ title: '已删除', icon: 'success' });
      await loadStudents();
    } catch (e) {
      console.error('删除学生失败:', e);
    }
  };

  return (
    <View className="flex flex-col h-full bg-slate-50">
      <View className="bg-white px-4 py-3 flex flex-row items-center justify-between shadow-sm">
        <Text className="block text-lg font-bold text-slate-900">学生管理</Text>
        <Button size="sm" className="bg-indigo-600" onClick={openAdd}>
          <Plus size={16} color="#fff" />
          <Text className="block text-white text-sm ml-1">添加学生</Text>
        </Button>
      </View>

      <ScrollView className="flex-1 px-4 pt-3 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-slate-400">加载中...</Text>
          </View>
        ) : students.length === 0 ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-slate-400">暂无学生，点击右上角添加</Text>
          </View>
        ) : (
          students.map((s) => (
            <Card key={s.id} className="mb-3">
              <CardContent className="p-4">
                <View className="flex flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="block text-base font-semibold text-slate-900">{s.name}</Text>
                    {s.level && (
                      <Text className="block text-xs text-indigo-600 mt-1 bg-indigo-50 px-2 py-0 rounded-full inline-block">
                        {s.level}
                      </Text>
                    )}
                    {s.phone && <Text className="block text-sm text-slate-500 mt-1">📞 {s.phone}</Text>}
                    {s.parent_name && <Text className="block text-sm text-slate-500">👨‍👩‍👧 家长: {s.parent_name}</Text>}
                    {s.notes && <Text className="block text-sm text-slate-400 mt-1">📝 {s.notes}</Text>}
                  </View>
                  <View className="flex flex-row gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                      <Pencil size={16} color="#64748B" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                      <Trash2 size={16} color="#EF4444" />
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="block text-lg font-semibold">{editId ? '编辑学生' : '添加学生'}</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="flex flex-col gap-4 py-2">
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">姓名 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent text-sm" placeholder="输入学生姓名" value={formName} onInput={(e) => setFormName(e.detail.value)} />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">电话</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent text-sm" placeholder="选填" value={formPhone} onInput={(e) => setFormPhone(e.detail.value)} />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">家长姓名</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent text-sm" placeholder="选填" value={formParent} onInput={(e) => setFormParent(e.detail.value)} />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">英语水平</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Select value={formLevel} onValueChange={setFormLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择水平" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lv) => (
                      <SelectItem key={lv} value={lv}>{lv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">备注</Text>
              <View className="bg-gray-50 rounded-2xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: 60, backgroundColor: 'transparent', fontSize: '14px' }}
                  placeholder="选填，学习情况等"
                  value={formNotes}
                  onInput={(e) => setFormNotes(e.detail.value)}
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

export default StudentsPage;
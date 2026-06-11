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

interface Course {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  color: string;
}

const colorOptions = [
  { label: '紫色', value: '#8B5CF6' },
  { label: '蓝色', value: '#3B82F6' },
  { label: '粉色', value: '#EC4899' },
  { label: '琥珀色', value: '#F59E0B' },
  { label: '翠绿色', value: '#10B981' },
  { label: '青色', value: '#06B6D4' },
  { label: '红色', value: '#EF4444' },
  { label: '靛蓝色', value: '#4F46E5' },
];

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formColor, setFormColor] = useState('#8B5CF6');

  const loadCourses = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/courses' });
      console.log('load courses:', res.data);
      setCourses(res.data?.data || []);
    } catch (e) {
      console.error('加载课程失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const openAdd = () => {
    setEditId(null);
    setFormName('');
    setFormDesc('');
    setFormDuration('60');
    setFormColor('#8B5CF6');
    setShowDialog(true);
  };

  const openEdit = (c: Course) => {
    setEditId(c.id);
    setFormName(c.name);
    setFormDesc(c.description || '');
    setFormDuration(String(c.duration_minutes));
    setFormColor(c.color);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入课程名称', icon: 'none' });
      return;
    }
    try {
      const url = editId ? `/api/courses/${editId}` : '/api/courses';
      const method = editId ? 'PUT' as const : 'POST' as const;
      const res = await Network.request({
        url,
        method,
        data: {
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          duration_minutes: Number(formDuration) || 60,
          color: formColor,
        },
      });
      console.log('save course:', res.data);
      setShowDialog(false);
      Taro.showToast({ title: editId ? '更新成功' : '添加成功', icon: 'success' });
      await loadCourses();
    } catch (e) {
      console.error('保存课程失败:', e);
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await Network.request({ url: `/api/courses/${id}`, method: 'DELETE' });
      Taro.showToast({ title: '已删除', icon: 'success' });
      await loadCourses();
    } catch (e) {
      console.error('删除课程失败:', e);
    }
  };

  return (
    <View className="flex flex-col h-full bg-slate-50">
      <View className="bg-white px-4 py-3 flex flex-row items-center justify-between shadow-sm">
        <Text className="block text-lg font-bold text-slate-900">课程管理</Text>
        <Button size="sm" className="bg-indigo-600" onClick={openAdd}>
          <Plus size={16} color="#fff" />
          <Text className="block text-white text-sm ml-1">添加课程</Text>
        </Button>
      </View>

      <ScrollView className="flex-1 px-4 pt-3 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-slate-400">加载中...</Text>
          </View>
        ) : courses.length === 0 ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-slate-400">暂无课程，点击右上角添加</Text>
          </View>
        ) : (
          courses.map((c) => (
            <Card key={c.id} className="mb-3">
              <CardContent className="p-4">
                <View className="flex flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex flex-row items-center gap-2">
                      <View className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                      <Text className="block text-base font-semibold text-slate-900">{c.name}</Text>
                    </View>
                    <Text className="block text-sm text-slate-500 mt-1">时长 {c.duration_minutes} 分钟</Text>
                    {c.description && <Text className="block text-sm text-slate-400 mt-1">{c.description}</Text>}
                  </View>
                  <View className="flex flex-row gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <Pencil size={16} color="#64748B" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
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
              <Text className="block text-lg font-semibold">{editId ? '编辑课程' : '添加课程'}</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="flex flex-col gap-4 py-2">
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">课程名称 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent text-sm" placeholder="如：少儿英语" value={formName} onInput={(e) => setFormName(e.detail.value)} />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">时长（分钟）</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent text-sm" type="number" placeholder="60" value={formDuration} onInput={(e) => setFormDuration(e.detail.value)} />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">颜色标签</Text>
              <View className="flex flex-row flex-wrap gap-2">
                {colorOptions.map((co) => (
                  <View
                    key={co.value}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${formColor === co.value ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                    style={{ backgroundColor: co.value }}
                    onClick={() => setFormColor(co.value)}
                  />
                ))}
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">描述</Text>
              <View className="bg-gray-50 rounded-2xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: 60, backgroundColor: 'transparent', fontSize: '14px' }}
                  placeholder="选填，课程简介"
                  value={formDesc}
                  onInput={(e) => setFormDesc(e.detail.value)}
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

export default CoursesPage;
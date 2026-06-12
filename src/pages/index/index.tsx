import { View, Text, ScrollView, Picker } from '@tarojs/components';
import { useState, useEffect, useCallback } from 'react';
import { Network } from '@/network';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, FileText } from 'lucide-react-taro';
import Taro from '@tarojs/taro';

/* ============ 工具函数 ============ */
function getWeekRange(date: Date): { start: Date; end: Date; weekDays: Date[] } {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    weekDays.push(d);
  }
  const end = weekDays[6];
  return { start, end, weekDays };
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDisplay(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/* ============ 类型定义 ============ */
interface Teacher { id: number; name: string; }
interface Student { id: number; name: string; }
interface Course { id: number; name: string; color: string; }
interface Schedule {
  id: number;
  teacher_id: number;
  student_id: number;
  course_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  location: string | null;
  teacher: { id: number; name: string };
  student: { id: number; name: string };
  course: { id: number; name: string; color: string };
}

const statusLabels: Record<string, string> = {
  scheduled: '待上课',
  completed: '已完成',
  cancelled: '已取消',
};
const statusVariants: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const IndexPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [showStudentExport, setShowStudentExport] = useState(false);
  const [exportStudentId, setExportStudentId] = useState('');

  const toggleCollapse = (key: string) => {
    setCollapsedDates((prev) => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
  };

  // Form state
  const [formTeacher, setFormTeacher] = useState('');
  const [formStudent, setFormStudent] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const weekRange = getWeekRange(currentDate);
  const startDateStr = fmtDate(weekRange.start);
  const endDateStr = fmtDate(weekRange.end);

  // 加载排课数据
  const loadSchedules = useCallback(async () => {
    try {
      const res = await Network.request({
        url: `/api/schedules/by-week?start_date=${startDateStr}&end_date=${endDateStr}`,
      });
      console.log('load schedules:', res.data);
      setSchedules(res.data?.data || []);
    } catch (e) {
      console.error('加载排课失败:', e);
      Taro.showToast({ title: '加载排课失败', icon: 'none' });
    }
  }, [startDateStr, endDateStr]);

  // 加载教师/学生/课程列表
  const loadOptions = useCallback(async () => {
    try {
      const [tRes, sRes, cRes] = await Promise.all([
        Network.request({ url: '/api/teachers' }),
        Network.request({ url: '/api/students' }),
        Network.request({ url: '/api/courses' }),
      ]);
      setTeachers(tRes.data?.data || []);
      setStudents(sRes.data?.data || []);
      setCourses(cRes.data?.data || []);
    } catch (e) {
      console.error('加载选项失败:', e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSchedules(), loadOptions()]).finally(() => setLoading(false));
  }, [loadSchedules, loadOptions]);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // 导出 PDF
  const [exporting, setExporting] = useState(false);
  const exportPDF = async (type: 'week' | 'month') => {
    if (exporting) return;
    setExporting(true);
    try {
      const env = Taro.getEnv();
      const isMiniApp = env === Taro.ENV_TYPE.WEAPP || env === Taro.ENV_TYPE.TT;
      const now = currentDate;
      const year = now.getFullYear();
      const m = now.getMonth() + 1;
      const apiPath = type === 'week'
        ? `/api/export/week?start_date=${startDateStr}&end_date=${endDateStr}`
        : `/api/export/month?year=${year}&month=${m}`;

      if (isMiniApp) {
        // 小程序：下载后用 openDocument 预览
        const res = await Network.downloadFile({ url: apiPath });
        console.log('download res:', res);
        const fp = (res as any).filePath || (res as any).tempFilePath;
        if (fp) {
          await Taro.openDocument({ filePath: fp, fileType: 'pdf' });
        } else {
          Taro.showToast({ title: '导出文件获取失败', icon: 'none' });
        }
      } else {
        // H5：新窗口打开 PDF
        const baseUrl = window.location.origin;
        window.open(`${baseUrl}${apiPath}`, '_blank');
      }
      Taro.showToast({ title: type === 'week' ? '本周排课已导出' : '本月排课已导出', icon: 'success' });
    } catch (e) {
      console.error('导出失败:', e);
      Taro.showToast({ title: '导出失败，请检查服务', icon: 'none' });
    } finally {
      setExporting(false);
    }
  };

  // 按学生导出
  const exportStudentPdf = async () => {
    if (!exportStudentId) {
      Taro.showToast({ title: '请选择学生', icon: 'none' });
      return;
    }
    const student = students.find(s => String(s.id) === exportStudentId);
    if (!student) return;
    setExporting(true);
    try {
      const apiPath = `/api/export/student?student_id=${student.id}&student_name=${encodeURIComponent(student.name)}&start_date=${startDateStr}&end_date=${endDateStr}`;
      const isMiniApp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP || Taro.getEnv() === Taro.ENV_TYPE.TT;
      if (isMiniApp) {
        const res = await Network.downloadFile({ url: apiPath });
        if (res.statusCode === 200) {
          await Taro.openDocument({ filePath: res.tempFilePath });
        }
      } else {
        const baseUrl = window.location.origin;
        window.open(`${baseUrl}${apiPath}`, '_blank');
      }
      Taro.showToast({ title: `${student.name}的排课已导出`, icon: 'success' });
    } catch (e) {
      console.error('导出失败:', e);
      Taro.showToast({ title: '导出失败', icon: 'none' });
    } finally {
      setExporting(false);
      setShowStudentExport(false);
    }
  };

  // 打开添加弹窗
  const openAddDialog = (date?: string) => {
    setEditingId(null);
    setFormTeacher(teachers.length === 1 ? String(teachers[0].id) : '');
    setFormStudent(students.length === 1 ? String(students[0].id) : '');
    setFormCourse(courses.length === 1 ? String(courses[0].id) : '');
    setFormDate(date || fmtDate(new Date()));
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormNotes('');
    setFormLocation('');
    setShowAddDialog(true);
  };

  // 提交排课（新建/编辑）
  const handleSubmit = async () => {
    if (!formTeacher || !formStudent || !formCourse || !formDate || !formStartTime || !formEndTime) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    try {
      if (editingId) {
        await Network.request({
          url: `/api/schedules/${editingId}`,
          method: 'PUT',
          data: {
            teacher_id: Number(formTeacher),
            student_id: Number(formStudent),
            course_id: Number(formCourse),
            date: formDate,
            start_time: formStartTime,
            end_time: formEndTime,
            notes: formNotes || null,
            location: formLocation || null,
          },
        });
        Taro.showToast({ title: '修改成功', icon: 'success' });
      } else {
        await Network.request({
          url: '/api/schedules',
          method: 'POST',
          data: {
            teacher_id: Number(formTeacher),
            student_id: Number(formStudent),
            course_id: Number(formCourse),
            date: formDate,
            start_time: formStartTime,
            end_time: formEndTime,
            notes: formNotes || undefined,
            location: formLocation || undefined,
          },
        });
        Taro.showToast({ title: '排课成功', icon: 'success' });
      }
      setShowAddDialog(false);
      setEditingId(null);
      await loadSchedules();
    } catch (e) {
      console.error('保存排课失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  // 编辑排课弹窗
  const [editingId, setEditingId] = useState<number | null>(null);

  // 更新排课状态（快捷操作）
  const updateStatus = async (id: number, status: string) => {
    try {
      await Network.request({
        url: `/api/schedules/${id}`,
        method: 'PUT',
        data: { status },
      });
      await loadSchedules();
    } catch (e) {
      console.error('更新状态失败:', e);
    }
  };

  // 删除排课
  const deleteSchedule = async (id: number) => {
    try {
      await Network.request({ url: `/api/schedules/${id}`, method: 'DELETE' });
      Taro.showToast({ title: '已删除', icon: 'success' });
      await loadSchedules();
    } catch (e) {
      console.error('删除失败:', e);
    }
  };

  // 打开编辑弹窗
  const openEditDialog = (s: Schedule) => {
    setEditingId(s.id);
    setFormTeacher(teachers.length === 1 ? String(teachers[0].id) : String(s.teacher_id));
    setFormStudent(students.length === 1 ? String(students[0].id) : String(s.student_id));
    setFormCourse(courses.length === 1 ? String(courses[0].id) : String(s.course_id));
    setFormDate(s.date);
    setFormStartTime(s.start_time);
    setFormEndTime(s.end_time);
    setFormNotes(s.notes || '');
    setFormLocation(s.location || '');
    setShowAddDialog(true);
  };

  // 按日期分组排课
  const schedulesByDate: Record<string, Schedule[]> = {};
  weekRange.weekDays.forEach((d) => {
    const key = fmtDate(d);
    schedulesByDate[key] = schedules.filter((s) => s.date === key);
  });

  return (
    <View className="flex flex-col h-full bg-slate-50">
      {/* 周导航 */}
      <View className="bg-white px-4 py-3 shadow-sm">
        <View className="flex flex-row items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={prevWeek}>
            <ChevronLeft size={20} color="#4F46E5" />
          </Button>
          <View className="flex flex-row items-center gap-2">
            <Calendar size={18} color="#4F46E5" />
            <Text className="block text-base font-semibold text-slate-900">
              {weekRange.start.getMonth() + 1}月{weekRange.start.getDate()}日 - {weekRange.end.getMonth() + 1}月{weekRange.end.getDate()}日
            </Text>
          </View>
          <Button variant="ghost" size="sm" onClick={nextWeek}>
            <ChevronRight size={20} color="#4F46E5" />
          </Button>
        </View>
        <View className="flex flex-row items-center gap-2 self-center">
          <Button variant="outline" size="sm" onClick={goToday}>
            <Text className="block text-xs">今天</Text>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF('week')}>
            <FileText size={14} color="#4F46E5" />
            <Text className="block text-xs ml-1">导出本周</Text>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF('month')}>
            <FileText size={14} color="#8B5CF6" />
            <Text className="block text-xs ml-1">导出本月</Text>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowStudentExport(true)}>
            <FileText size={14} color="#EC4899" />
            <Text className="block text-xs ml-1">按学生导出</Text>
          </Button>
        </View>
      </View>

      {/* 星期行 */}
      <ScrollView scrollX className="bg-white px-2 pb-2">
        <View className="flex flex-row gap-1">
          {weekRange.weekDays.map((d) => {
            const key = fmtDate(d);
            const isToday = key === fmtDate(new Date());
            const count = schedulesByDate[key]?.length || 0;
            return (
              <View
                key={key}
                className="flex flex-col items-center w-24 py-1 rounded-lg"
              >
                <Text className={`block text-xs ${isToday ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                  周{['日', '一', '二', '三', '四', '五', '六'][d.getDay()]}
                </Text>
                <Text className={`block text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                  {d.getDate()}
                </Text>
                {count > 0 && (
                  <Badge className="text-xs px-1 py-0">{count}节</Badge>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 排课列表 */}
      <ScrollView className="flex-1 px-4 pt-2 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-slate-400">加载中...</Text>
          </View>
        ) : (
          weekRange.weekDays.map((d) => {
            const key = fmtDate(d);
            const daySchedules = schedulesByDate[key] || [];
            return (
              <View key={key} className="mb-3">
                <View className="flex flex-row items-center justify-between mb-1">
                  <Text className="block text-sm font-semibold text-slate-700">
                    {fmtDisplay(d)}
                  </Text>
                  <View className="flex flex-row items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => toggleCollapse(key)}>
                      <ChevronUp size={14} color="#94a3b8" />
                      <Text className="block text-xs text-slate-400 ml-1">
                        {collapsedDates[key] !== false ? '展开' : '收起'}
                      </Text>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openAddDialog(key)}>
                      <Plus size={16} color="#4F46E5" />
                      <Text className="block text-xs text-indigo-600 ml-1">添加</Text>
                    </Button>
                  </View>
                </View>
                {collapsedDates[key] !== false ? null : daySchedules.length === 0 ? (
                  <View className="bg-white rounded-xl p-4 flex items-center justify-center">
                    <Text className="block text-sm text-slate-400">暂无排课</Text>
                  </View>
                ) : (
                  daySchedules.map((s) => (
                    <Card key={s.id} className="mb-2">
                      <CardContent className="p-3">
                        <View className="flex flex-row items-start gap-3">
                          <View
                            className="w-1 h-full rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.course?.color || '#8B5CF6', minHeight: 48 }}
                          />
                          <View className="flex-1">
                            {/* 课程名 + 状态 */}
                            <View className="flex flex-row items-center justify-between mb-1">
                              <Text className="block text-sm font-semibold text-slate-900">
                                {s.course?.name || '未知课程'}
                              </Text>
                              <Badge className={`text-xs ${statusVariants[s.status] || ''}`}>
                                {statusLabels[s.status] || s.status}
                              </Badge>
                            </View>
                            {/* 时间靠左 + 修改/完成/取消/删除 靠右 */}
                            <View className="flex flex-row items-center justify-between">
                              <Text className="block text-xs font-medium text-indigo-600">
                                {s.start_time} - {s.end_time}
                              </Text>
                              <View className="flex flex-row items-center gap-x-2 flex-shrink-0">
                              <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => openEditDialog(s)}>
                                <Text className="block text-xs text-indigo-500">修改</Text>
                              </Button>
                              {s.status === 'scheduled' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1"
                                    onClick={() => updateStatus(s.id, 'completed')}
                                  >
                                    <Text className="block text-xs text-green-600">完成</Text>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1"
                                    onClick={() => updateStatus(s.id, 'cancelled')}
                                  >
                                    <Text className="block text-xs text-red-500">取消</Text>
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                                onClick={() => deleteSchedule(s.id)}
                              >
                                <Text className="block text-xs text-slate-400">删除</Text>
                              </Button>
                            </View>
                            </View>
                            <Text className="block text-xs text-slate-500 mt-1">
                              教师 {s.teacher?.name || '未知'} · 学生 {s.student?.name || '未知'}
                            </Text>
                            {s.location && (
                              <Text className="block text-xs text-slate-500 mt-1">
                                地址 {s.location}
                              </Text>
                            )}
                            {s.notes && (
                              <Text className="block text-xs text-slate-400 mt-1">
                                备注 {s.notes}
                              </Text>
                            )}
                          </View>
                        </View>
                      </CardContent>
                    </Card>
                  ))
                )}
                <Separator className="mt-2" />
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 浮动添加按钮 */}
      <View className="fixed right-6 bottom-24 z-50">
        <Button
          className="w-14 h-14 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center"
          onClick={() => openAddDialog()}
        >
          <Plus size={24} color="#fff" />
        </Button>
      </View>

      {/* 添加排课弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>
              <Text className="block text-lg font-semibold">{editingId ? '编辑排课' : '添加排课'}</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="flex flex-col gap-4 py-2">
            {/* 日期 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">日期</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  type="text"
                  placeholder="选择日期 (YYYY-MM-DD)"
                  value={formDate}
                  onInput={(e) => setFormDate(e.detail.value)}
                />
              </View>
            </View>
            {/* 时间段 */}
            <View className="flex flex-row gap-3">
              <View className="flex-1">
                <Text className="block text-sm font-medium text-slate-700 mb-1">开始时间</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-sm"
                    type="text"
                    placeholder="09:00"
                    value={formStartTime}
                    onInput={(e) => setFormStartTime(e.detail.value)}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-medium text-slate-700 mb-1">结束时间</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-sm"
                    type="text"
                    placeholder="10:00"
                    value={formEndTime}
                    onInput={(e) => setFormEndTime(e.detail.value)}
                  />
                </View>
              </View>
            </View>
            {/* 教师选择 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">教师</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Select value={formTeacher} onValueChange={setFormTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择教师">
                      {teachers.find(t => String(t.id) === formTeacher)?.name || ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            </View>
            {/* 学生选择 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">学生</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Select value={formStudent} onValueChange={setFormStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学生">
                      {students.find(s => String(s.id) === formStudent)?.name || ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            </View>
            {/* 课程选择 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">课程</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Select value={formCourse} onValueChange={setFormCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择课程">
                      {courses.find(c => String(c.id) === formCourse)?.name || ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <View className="flex flex-row items-center gap-2">
                          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          <Text className="block text-sm">{c.name}</Text>
                        </View>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            </View>
            {/* 地址 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">地址</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="上课地点（选填）"
                  value={formLocation}
                  onInput={(e) => setFormLocation(e.detail.value)}
                />
              </View>
            </View>
            {/* 备注 */}
            <View>
              <Text className="block text-sm font-medium text-slate-700 mb-1">备注</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="选填"
                  value={formNotes}
                  onInput={(e) => setFormNotes(e.detail.value)}
                />
              </View>
            </View>
            <Button className="w-full bg-indigo-600" onClick={handleSubmit}>
              <Text className="block text-white font-medium">{editingId ? '保存修改' : '确认排课'}</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* 按学生导出弹窗 */}
      <Dialog open={showStudentExport} onOpenChange={setShowStudentExport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择学生导出排课</DialogTitle>
          </DialogHeader>
          <View className="space-y-4">
            <View className="bg-gray-50 rounded-xl px-3 py-2">
              <Picker mode="selector" range={students.map(s => s.name)} onChange={(e: any) => {
                const idx = parseInt((e as any).detail.value || '0');
                if (students[idx]) setExportStudentId(`${students[idx].id}`);
              }}
              >
                <View className="flex flex-row items-center justify-between py-1">
                  <Text className="block text-sm text-gray-500">
                    {students.find(s => String(s.id) === exportStudentId)?.name || '请选择学生'}
                  </Text>
                  <ChevronDown size={16} color="#94a3b8" />
                </View>
              </Picker>
            </View>
            <Button disabled={!exportStudentId || exporting} className="w-full bg-indigo-600" onClick={exportStudentPdf}>
              <Text className="block text-white font-medium">
                {exporting ? '导出中...' : `导出 ${students.find(s => String(s.id) === exportStudentId)?.name || ''} 的排课`}
              </Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
};

export default IndexPage;
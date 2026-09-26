"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  ArrowLeft,
  Filter,
  Check,
  ChevronRight,
  Flame,
  MessageSquare,
  Edit3,
  X,
  Save,
  GripVertical,
} from "lucide-react";
import {
  getProductionTasks,
  advanceTaskStage,
  updateTaskStage,
  updateTaskStatus,
  updateTaskDetails,
} from "./../actions";
import Link from "next/link";

const STAGES = [
  { id: "DESIGN", name: "1. التصميم والإخراج", icon: "🎨", color: "#2BA8A2", border: "border-r-[#2BA8A2]", lightBg: "bg-[#EAF6F4]" },
  { id: "PRINTING", name: "2. سحب الطباعة", icon: "🖨️", color: "#FFD23F", border: "border-r-[#FFD23F]", lightBg: "bg-[#FFF8E7]" },
  { id: "FINISHING", name: "3. القص والتشطيب", icon: "✂️", color: "#5DADE2", border: "border-r-[#5DADE2]", lightBg: "bg-[#EBF5FB]" },
  { id: "DELIVERY", name: "4. جاهز للتسليم", icon: "📦", color: "#27AE60", border: "border-r-[#27AE60]", lightBg: "bg-[#EAFAF1]" },
];

export default function ProductionKanbanPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState<string>("ALL");
  const [filterUrgentOnly, setFilterUrgentOnly] = useState<boolean>(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskNotes, setTaskNotes] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<string>("NORMAL");
  const [isPending, startTransition] = useTransition();

  const loadTasks = async () => {
    setLoading(true);
    const res = await getProductionTasks();
    if (res.success) {
      setTasks(res.tasks || []);
      setEmployees(res.employees || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAdvance = (taskId: string) => {
    startTransition(async () => {
      await advanceTaskStage(taskId);
      loadTasks();
    });
  };

  const handleAssign = (taskId: string, empId: string) => {
    startTransition(async () => {
      const task = tasks.find((t) => t.id === taskId);
      await updateTaskStatus(taskId, task?.status || "PENDING", empId);
      loadTasks();
    });
  };

  const handleMoveTaskToStage = async (taskId: string, nextStage: string) => {
    if (!taskId || !nextStage) return;

    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.stage === nextStage) {
      setDraggedTaskId(null);
      setHoveredStageId(null);
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, stage: nextStage, status: "IN_PROGRESS", completedAt: null } : item,
      ),
    );

    await updateTaskStage(taskId, nextStage);
    await loadTasks();
    setDraggedTaskId(null);
    setHoveredStageId(null);
  };

  const openNotesModal = (task: any) => {
    setEditingTask(task);
    setTaskNotes(task.notes || "");
    setTaskPriority(task.priority || "NORMAL");
  };

  const handleSaveNotes = () => {
    if (!editingTask) return;
    startTransition(async () => {
      await updateTaskDetails({
        taskId: editingTask.id,
        notes: taskNotes,
        priority: taskPriority,
      });
      setEditingTask(null);
      await loadTasks();
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterEmployee !== "ALL" && task.assignedToId !== filterEmployee) return false;
    if (filterUrgentOnly && task.priority !== "URGENT") return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2BA8A2] to-[#3CC4BD] text-white flex items-center justify-center shadow-teal-glow">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
                لوحة كانبان • خط تشغيل المطبوعات
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                تتبع مسار الأوامر الفنية من التصميم إلى التسليم النهائي
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Urgent Filter Toggle */}
          <button
            onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
            className={`btn-pill px-3.5 py-1.5 text-xs border ${
              filterUrgentOnly
                ? "bg-[#EF6C4A] text-white border-[#EF6C4A] shadow-coral-glow"
                : "bg-[#FFF8E7] text-[#D45233] border-[#FFE47A]"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            طلبات عاجلة فقط
          </button>

          {/* Employee Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#F4FAF9] border border-gray-200 rounded-full px-3 py-1">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1E8C86] focus:outline-none cursor-pointer"
            >
              <option value="ALL">جميع الفنيين والمصممين</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.jobTitle.slice(0, 15)}...)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAGES.map((stage) => {
          const stageTasks = filteredTasks.filter((t) => t.stage === stage.id);
          const isHovered = hoveredStageId === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(event) => {
                event.preventDefault();
                if (hoveredStageId !== stage.id) setHoveredStageId(stage.id);
              }}
              onDragLeave={() => {
                if (hoveredStageId === stage.id) setHoveredStageId(null);
              }}
              onDrop={() => {
                if (draggedTaskId) {
                  void handleMoveTaskToStage(draggedTaskId, stage.id);
                }
              }}
              className={`flex flex-col rounded-3xl p-4 border-2 transition-all min-h-[540px] ${
                isHovered
                  ? "border-[#2BA8A2] bg-[#F0FAF9] shadow-lg scale-[1.01]"
                  : draggedTaskId
                  ? "border-dashed border-gray-300 bg-gray-50/50"
                  : "border-gray-200/80 bg-gray-50/70"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-dashed border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{stage.icon}</span>
                  <h3 className="font-black text-sm text-[#142826]">{stage.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1E8C86] font-black text-xs shadow-sm border border-gray-200">
                  {stageTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3.5 flex-1 overflow-y-auto">
                {stageTasks.length > 0 ? (
                  stageTasks.map((task) => {
                    const isUrgent = task.priority === "URGENT";
                    const isDone = task.status === "COMPLETED";

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setHoveredStageId(null);
                        }}
                        className={`group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${stage.border} border-r-4 transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
                          isUrgent ? "ring-1 ring-[#EF6C4A]/40 shadow-coral-glow/20" : ""
                        } ${draggedTaskId === task.id ? "opacity-40 scale-95 border-dashed border-[#2BA8A2]" : ""}`}
                      >
                        {/* Header: Drag handle, Code, and Urgent badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#2BA8A2] transition-colors" />
                            <Link
                              href={`/invoices/${task.invoiceId}`}
                              className="font-mono text-[11px] font-bold text-[#1E8C86] hover:underline"
                            >
                              {task.invoice?.invoiceCode || "طلب تشغيل"}
                            </Link>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isUrgent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF0EC] text-[#EF6C4A] text-[10px] font-black border border-[#EF6C4A]/30 animate-pulse">
                                <Flame className="w-3 h-3" />
                                عاجل
                              </span>
                            )}
                            <button
                              onClick={() => openNotesModal(task)}
                              className="p-1 rounded-lg text-gray-400 hover:text-[#1E8C86] hover:bg-[#F4FAF9] transition-colors"
                              title="إضافة أو تعديل الملاحظات"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-black text-xs text-gray-800 leading-relaxed mb-1.5">
                          {task.title}
                        </h4>

                        {/* Client Name */}
                        <p className="text-[11px] text-gray-500 font-medium mb-2.5">
                          العميل: <span className="font-bold text-gray-700">{task.invoice?.clientName || "نقدي"}</span>
                        </p>

                        {/* Notes / Comments snippet if exists */}
                        {task.notes && (
                          <div
                            onClick={() => openNotesModal(task)}
                            className="mb-3 p-2.5 rounded-xl bg-[#FFFBF0] border border-[#FFE47A]/60 cursor-pointer hover:bg-[#FFF8E7] transition-colors"
                          >
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#D48208] mb-0.5">
                              <MessageSquare className="w-3 h-3" />
                              <span>ملاحظات التشغيل:</span>
                            </div>
                            <p className="text-[11px] text-gray-700 font-medium line-clamp-2 leading-relaxed">
                              {task.notes}
                            </p>
                          </div>
                        )}

                        {/* Employee Assignment Dropdown */}
                        <div className="mb-3 pt-2.5 border-t border-dashed border-gray-100 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold">
                            الفني المسؤول:
                          </span>
                          <select
                            value={task.assignedToId || ""}
                            onChange={(e) => handleAssign(task.id, e.target.value)}
                            className="text-[11px] font-bold text-[#1E8C86] bg-[#F4FAF9] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none max-w-[135px]"
                          >
                            <option value="">(غير معين)</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Stage Progression Action Button */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isDone
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isDone ? "مكتمل" : "جاري التنفيذ"}
                          </span>

                          <button
                            onClick={() => handleAdvance(task.id)}
                            disabled={isPending}
                            className={`btn-pill px-3 py-1.5 text-xs font-black shadow-sm transition-transform active:scale-95 ${
                              stage.id === "DELIVERY"
                                ? "bg-[#27AE60] hover:bg-emerald-600 text-white shadow-teal-glow"
                                : "bg-[#FFD23F] hover:bg-[#FFE47A] text-[#1E4D48] shadow-gold-glow"
                            }`}
                          >
                            {stage.id === "DELIVERY" ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                إتمام التسليم
                              </>
                            ) : (
                              <>
                                المرحلة التالية
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                    <span className="text-xl mb-1 opacity-40">{stage.icon}</span>
                    <span>اسحب البطاقات إلى هنا لنقلها لهذه المرحلة</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes & Card Editing Modal Dialog */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF6F4] text-[#1E8C86] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#142826]">
                    ملاحظات وتعليمات أمر التشغيل
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {editingTask.invoice?.invoiceCode} • {editingTask.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                أولوية أمر التشغيل
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTaskPriority("NORMAL")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    taskPriority === "NORMAL"
                      ? "bg-[#2BA8A2]/10 border-[#2BA8A2] text-[#1E8C86]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  عادي (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => setTaskPriority("URGENT")}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    taskPriority === "URGENT"
                      ? "bg-[#EF6C4A]/10 border-[#EF6C4A] text-[#EF6C4A]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  عاجل وطارئ (Urgent)
                </button>
              </div>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                التعليمات الفنية والملاحظات للمصمم والفني
              </label>
              <textarea
                rows={4}
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="اكتب أي مواصفات خاصة: نوع السلوفان، تفاصيل القص، ملاحظات العميل، أو موعد التسليم..."
                className="w-full input-cream rounded-2xl p-3 text-xs font-bold leading-relaxed resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white shadow-teal-glow text-xs font-black hover:opacity-95 transition-opacity"
              >
                <Save className="w-4 h-4" />
                حفظ التعليمات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

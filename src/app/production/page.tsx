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
} from "lucide-react";
import { getProductionTasks, advanceTaskStage, updateTaskStage, updateTaskStatus } from "./../actions";
import Link from "next/link";

const STAGES = [
  { id: "DESIGN", name: "1. التصميم والإخراج", icon: "🎨", color: "#2BA8A2", border: "border-r-[#2BA8A2]" },
  { id: "PRINTING", name: "2. سحب الطباعة", icon: "🖨️", color: "#FFD23F", border: "border-r-[#FFD23F]" },
  { id: "FINISHING", name: "3. القص والتشطيب", icon: "✂️", color: "#5DADE2", border: "border-r-[#5DADE2]" },
  { id: "DELIVERY", name: "4. جاهز للتسليم", icon: "📦", color: "#27AE60", border: "border-r-[#27AE60]" },
];

export default function ProductionKanbanPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState<string>("ALL");
  const [filterUrgentOnly, setFilterUrgentOnly] = useState<boolean>(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
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

          return (
            <div
              key={stage.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedTaskId) {
                  void handleMoveTaskToStage(draggedTaskId, stage.id);
                }
              }}
              className={`flex flex-col bg-gray-50/70 rounded-2xl p-4 border min-h-[500px] transition-all ${
                draggedTaskId ? "border-[#2BA8A2]/40 bg-[#F3FBFA]" : "border-gray-200/80"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-dashed border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-base">{stage.icon}</span>
                  <h3 className="font-black text-sm text-[#142826]">{stage.name}</h3>
                </div>
                <span className="w-6 h-6 rounded-full bg-white text-[#1E8C86] font-black text-xs flex items-center justify-center shadow-sm border border-gray-200">
                  {stageTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
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
                        onDragEnd={() => setDraggedTaskId(null)}
                        className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${stage.border} border-r-4 transition-all hover:shadow-card-subtle ${
                          isUrgent ? "ring-1 ring-[#EF6C4A]/40 shadow-coral-glow/20" : ""
                        } ${draggedTaskId === task.id ? "opacity-60 scale-[0.98]" : ""}`}
                      >
                        {/* Urgent Badge & Code */}
                        <div className="flex items-center justify-between mb-2">
                          <Link
                            href={`/invoices/${task.invoiceId}`}
                            className="font-mono text-[11px] font-bold text-[#1E8C86] hover:underline"
                          >
                            {task.invoice?.invoiceCode || "طلب طباعة"}
                          </Link>

                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF0EC] text-[#EF6C4A] text-[10px] font-black border border-[#EF6C4A]/30 animate-pulse">
                              <Flame className="w-3 h-3" />
                              عاجل
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-xs text-gray-800 leading-relaxed mb-2">
                          {task.title}
                        </h4>

                        {/* Client Name */}
                        <p className="text-[11px] text-gray-500 font-medium mb-3">
                          العميل: {task.invoice?.clientName || "نقدي"}
                        </p>

                        {/* Employee Assignment Dropdown */}
                        <div className="mb-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-medium">
                            المسؤول:
                          </span>
                          <select
                            value={task.assignedToId || ""}
                            onChange={(e) => handleAssign(task.id, e.target.value)}
                            className="text-[11px] font-bold text-[#1E8C86] bg-[#FFF8E7] border border-[#FFE47A] rounded-lg px-2 py-0.5 focus:outline-none max-w-[130px]"
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
                        <div className="pt-1 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDone
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {isDone ? "مكتمل" : "جاري التنفيذ"}
                          </span>

                          <button
                            onClick={() => handleAdvance(task.id)}
                            disabled={isPending}
                            className={`btn-pill px-3 py-1 text-xs font-black shadow-sm ${
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
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                    <span>لا توجد طلبات في هذه المرحلة</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

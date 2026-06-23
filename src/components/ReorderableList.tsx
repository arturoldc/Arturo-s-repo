"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "@/lib/types";
import { ItemCard } from "./ItemCard";

export function ReorderableList({
  items,
  onReorder,
  onToggleDone,
  onOpen,
}: {
  items: Item[];
  onReorder: (orderedIds: string[]) => void;
  onToggleDone: (id: string) => void;
  onOpen: (item: Item) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              onToggleDone={() => onToggleDone(item.id)}
              onOpen={() => onOpen(item)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  item,
  onToggleDone,
  onOpen,
}: {
  item: Item;
  onToggleDone: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* drag grip */}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute left-1 top-1/2 z-10 -translate-y-1/2 cursor-grab touch-none px-1 text-zinc-300 active:cursor-grabbing"
      >
        ⠿
      </button>
      <ItemCard item={item} onToggleDone={onToggleDone} onOpen={onOpen} />
    </div>
  );
}

"use client";

import { ToolName } from "@/lib/const";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAgentContext } from "../agent-context";
import { EditorTool, PublishTool } from "../tools";

export function ToolList() {
  // Use the toolList state from the agent context
  const { toolList } = useAgentContext();
  const { tools, moveTool, getToolIndex } = toolList;

  // Configure dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = getToolIndex(active.id as ToolName);
      const newIndex = getToolIndex(over.id as ToolName);

      if (oldIndex !== -1 && newIndex !== -1) {
        moveTool(oldIndex, newIndex);
      }
    }
  };

  // Render the appropriate tool component based on the tool name
  const renderTool = (toolName: ToolName) => {
    switch (toolName) {
      case ToolName.CODE_EDITOR:
        return <EditorTool key={toolName} />;
      case ToolName.PUBLISH:
        return <PublishTool key={toolName} />;
      default:
        return null;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto flex w-full flex-col space-y-3">
        <SortableContext items={tools} strategy={verticalListSortingStrategy}>
          {tools.map(renderTool)}
        </SortableContext>
      </div>
    </DndContext>
  );
}

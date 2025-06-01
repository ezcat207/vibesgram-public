"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { Check, ChevronsUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useAgentContext } from "../agent-context";

export function ConversationSelector() {
  // State
  const [open, setOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [changeTitleDialogOpen, setChangeTitleDialogOpen] =
    React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [conversationToDelete, setConversationToDelete] = React.useState<
    string | null
  >(null);

  // Hooks
  const router = useRouter();
  const { toast } = useToast();
  const { chat } = useAgentContext();

  // Get current conversation ID
  const currentConversationId = chat.id;

  // Get conversation list
  const {
    data: conversations,
    isLoading,
    refetch,
  } = api.conversation.getConversations.useQuery(undefined, {
    // Refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  // Delete conversation mutation
  const deleteConversation = api.conversation.deleteConversation.useMutation({
    onSuccess: () => {
      void refetch();
      toast({
        title: "Success",
        description: "Conversation deleted",
      });
      setDeleteDialogOpen(false);

      // If the deleted conversation is the current one, find the most recent remaining conversation to navigate to
      if (conversationToDelete === currentConversationId) {
        if (conversations && conversations.length > 1) {
          // Find other conversations
          const remainingConversations = conversations.filter(
            (c) => c.id !== conversationToDelete,
          );

          if (remainingConversations.length > 0) {
            // Sort by update time and get the most recent conversation
            const mostRecentConversation = remainingConversations.sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            )[0];

            // Navigate to the most recent conversation
            if (mostRecentConversation) {
              router.push(`/agent/${mostRecentConversation.id}`);
            } else {
              // Fallback if sort somehow returns undefined
              router.push("/agent/new");
            }
          } else {
            // Create new conversation if somehow there are no remaining conversations
            router.push("/agent/new");
          }
        } else {
          // Only create a new conversation when there are no other conversations
          router.push("/agent/new");
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change title mutation
  const changeTitle = api.conversation.changeTitle.useMutation({
    onSuccess: () => {
      void refetch();
      toast({
        title: "Success",
        description: "Conversation title updated",
      });
      setChangeTitleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle conversation deletion
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation.mutate({ id: conversationToDelete });
    }
  };

  // Navigate to conversation
  const navigateToConversation = (id: string) => {
    if (id !== currentConversationId) {
      router.push(`/agent/${id}`);
    }
    setOpen(false);
  };

  // Navigate to new conversation
  const navigateToNewConversation = () => {
    router.push("/agent/new");
    setOpen(false);
  };

  // Handle title change
  const handleChangeTitle = () => {
    if (currentConversationId && newTitle.trim()) {
      changeTitle.mutate({
        id: currentConversationId,
        title: newTitle.trim(),
      });
    }
  };

  // Open change title dialog and set initial title
  const openChangeTitleDialog = () => {
    if (!conversations) return;
    const current = conversations.find((c) => c.id === currentConversationId);
    setNewTitle(current?.title ?? "");
    setChangeTitleDialogOpen(true);
    setOpen(false);
  };

  // Get current conversation title
  const currentConversationTitle = React.useMemo(() => {
    if (!conversations) return "Select conversation...";
    const current = conversations.find((c) => c.id === currentConversationId);
    return current?.title ?? "New conversation";
  }, [conversations, currentConversationId]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="inline-flex w-auto min-w-[100px] max-w-[300px] justify-between text-left font-normal"
          >
            <span className="mr-1 overflow-hidden overflow-ellipsis whitespace-nowrap">
              {isLoading ? "Loading..." : currentConversationTitle}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto min-w-[100px] max-w-[450px] p-0">
          <Command>
            <CommandInput
              placeholder="Search conversations..."
              className="h-9"
            />
            <CommandList className="max-h-[500px] overflow-auto">
              <CommandEmpty>No conversations found</CommandEmpty>

              {/* New conversation option (at the top) */}
              <CommandGroup>
                <CommandItem
                  onSelect={navigateToNewConversation}
                  className="flex items-center font-medium text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New conversation
                </CommandItem>
                {/* Change title option */}
                <CommandItem
                  onSelect={openChangeTitleDialog}
                  className="flex items-center"
                  disabled={
                    !currentConversationId || currentConversationId === "new"
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Change title
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Existing conversation list */}
              {!isLoading && conversations && conversations.length > 0 && (
                <CommandGroup heading="Recent conversations">
                  {conversations.map((conversation) => (
                    <CommandItem
                      key={conversation.id}
                      value={conversation.id}
                      onSelect={() => navigateToConversation(conversation.id)}
                      className="flex items-center justify-between pr-2"
                    >
                      <div className="flex max-w-[230px] items-center overflow-hidden">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 flex-shrink-0",
                            currentConversationId === conversation.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="overflow-hidden">
                          <div className="truncate">
                            {conversation.title ?? "Untitled conversation"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(conversation.updatedAt),
                              { addSuffix: true },
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) =>
                          handleDeleteConversation(conversation.id, e)
                        }
                        className="ml-2 h-6 w-6 flex-shrink-0 opacity-70 hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change title dialog */}
      <AlertDialog
        open={changeTitleDialogOpen}
        onOpenChange={setChangeTitleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change conversation title</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new title for this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="Enter conversation title"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeTitle}
              disabled={!newTitle.trim()}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

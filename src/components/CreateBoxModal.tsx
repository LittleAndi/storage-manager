import React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { useBoxesStore } from "@/state/boxesStore";
import type { NewBox } from "@/types/entities";
import { useNavigate, useParams } from "react-router-dom";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateBoxModalProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: { name: string; location: string; content?: string }) => void;
}

const CreateBoxModal: React.FC<CreateBoxModalProps> = ({ open, onClose, onCreate }) => {
  const form = useForm({
    defaultValues: {
      name: "",
      location: "",
      content: "",
    },
  });
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const addBox = useBoxesStore((state) => state.addBox);

  const handleSubmit = async (values: { name: string; location: string; content?: string }) => {
    if (!spaceId) return;
    const newBox: NewBox = {
      name: values.name,
      location: values.location,
      space_id: spaceId,
      content: values.content,
    };
    await addBox(newBox);
    if (onCreate) onCreate(values);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    onClose();
    // If opened via route, navigate back to space detail
    if (window.location.pathname.endsWith("/boxes/new")) {
      navigate(`/spaces/${spaceId}`);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Box</AlertDialogTitle>
          <AlertDialogDescription />
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormItem>
              <FormLabel htmlFor="box-name">Box Name</FormLabel>
              <FormControl>
                <Input
                  id="box-name"
                  placeholder="Enter box name"
                  {...form.register("name", { required: true })}
                  autoFocus
                />
              </FormControl>
              <FormDescription>Required. Give your box a descriptive name.</FormDescription>
            </FormItem>
            <FormItem>
              <FormLabel htmlFor="box-location">Location</FormLabel>
              <FormControl>
                <Input
                  id="box-location"
                  placeholder="Enter location (optional)"
                  {...form.register("location")}
                />
              </FormControl>
              <FormDescription>Optional. Where is this box stored?</FormDescription>
            </FormItem>
            <FormItem>
              <FormLabel htmlFor="box-content">Content</FormLabel>
              <FormControl>
                <Textarea
                  id="box-content"
                  placeholder="Enter box content (optional)"
                  {...form.register("content")}
                  rows={5}
                />
              </FormControl>
              <FormDescription>Optional. What does this box contain?</FormDescription>
            </FormItem>
            <AlertDialogFooter>
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateBoxModal;

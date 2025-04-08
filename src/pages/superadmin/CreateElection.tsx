
import React from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  type: z.string(),
  status: z.string(),
  date: z.string(),
  applicationStartDate: z.string(),
  applicationEndDate: z.string(),
  resultDate: z.string().optional(),
  description: z.string().optional(),
  states: z.array(z.string()).optional(),
  districts: z.array(z.string()).optional(),
});

const CreateElection = () => {
  const { toast } = useToast();

  // Mock data for dropdowns
  const electionTypes = ["Lok Sabha", "Vidhan Sabha", "Local Body", "Panchayat"];
  const electionStatuses = ["Preparation", "Scheduled", "Active", "Completed"];
  const states = ["All India", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"];
  const districts = ["Mumbai", "Delhi", "Bangalore", "Chennai"];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      status: "Preparation",
      date: "",
      applicationStartDate: "",
      applicationEndDate: "",
      resultDate: "",
      description: "",
      states: [],
      districts: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, this would send data to a backend API
    console.log(values);
    toast({
      title: "Election Created",
      description: `${values.name} has been created successfully.`,
    });
    form.reset();
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Election</h1>
          <p className="text-gray-500">Set up a new election</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Election Information</CardTitle>
            <CardDescription>Enter the details for the new election</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter election name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election Type*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select election type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {electionTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {electionStatuses.map((status) => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicationStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Start Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicationEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application End Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resultDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter details about the election" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit">Create Election</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateElection;


import React from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
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
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  voter_id: z.string().min(10, {
    message: "Voter ID must be at least 10 characters.",
  }),
  dob: z.string(),
  state: z.string(),
  district: z.string(),
  loksabhaWard: z.string(),
  vidhansabhaWard: z.string(),
  municipalCorporation: z.string(),
  municipalCorporationWard: z.string(),
  booth: z.string(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const RegisterVoter = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock data for dropdowns
  const booths = ["Booth #123, Municipal School", "Booth #145, Community Hall", "Booth #127, Public School"];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      voter_id: "",
      dob: "",
      state: user?.state || "",
      district: user?.district || "",
      loksabhaWard: "",
      vidhansabhaWard: "",
      municipalCorporation: "",
      municipalCorporationWard: "",
      booth: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, this would send data to a backend API
    console.log(values);
    toast({
      title: "Voter Registered",
      description: `${values.name} has been registered successfully as a voter.`,
    });
    form.reset();
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Register Voter</h1>
          <p className="text-gray-500">Add a new voter to {user?.constituency || 'your constituency'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Voter Information</CardTitle>
            <CardDescription>Enter the voter's personal and voting details</CardDescription>
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
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="voter_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voter ID*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter voter ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State*</FormLabel>
                        <FormControl>
                          <Input value={user?.state || 'Maharashtra'} readOnly {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District*</FormLabel>
                        <FormControl>
                          <Input value={user?.district || 'Mumbai'} readOnly {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="booth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booth*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select booth" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {booths.map((booth) => (
                              <SelectItem key={booth} value={booth}>{booth}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password*</FormLabel>
                        <FormControl>
                          <Input placeholder="Confirm password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel>Voter Photo</FormLabel>
                  <Input type="file" className="mt-1" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Register Voter</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RegisterVoter;

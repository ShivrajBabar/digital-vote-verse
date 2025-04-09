
import React, { useState } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { useToast } from "@/components/ui/use-toast";
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
  dob: z.string(),
  state: z.string(),
  district: z.string(),
  vidhansabha: z.string(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const RegisterAdmin = () => {
  const { toast } = useToast();
  
  // States for dependent dropdowns
  const [districts, setDistricts] = useState<string[]>([]);
  const [vidhansabhas, setVidhansabhas] = useState<string[]>([]);

  // Mock data for dropdowns
  const states = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"];
  const allDistricts = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane"],
    "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"]
  };
  
  const allVidhansabhas = {
    "Mumbai": ["Borivali", "Dahisar", "Kandivali East", "Worli", "Byculla", "Malabar Hill"],
    "Pune": ["Kothrud", "Shivajinagar", "Hadapsar"],
    "Delhi": ["Preet Vihar", "Vishwas Nagar", "Laxmi Nagar"],
    "Bangalore": ["Shivajinagar", "Shantinagar", "Gandhinagar"]
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dob: "",
      state: "",
      district: "",
      vidhansabha: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle state change to update districts dropdown
  const handleStateChange = (state: string) => {
    form.setValue("state", state);
    form.setValue("district", "");
    form.setValue("vidhansabha", "");
    setDistricts(allDistricts[state as keyof typeof allDistricts] || []);
    setVidhansabhas([]);
  };

  // Handle district change to update vidhansabha dropdown
  const handleDistrictChange = (district: string) => {
    form.setValue("district", district);
    form.setValue("vidhansabha", "");
    setVidhansabhas(allVidhansabhas[district as keyof typeof allVidhansabhas] || []);
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, this would send data to a backend API
    console.log(values);
    toast({
      title: "Admin Registered",
      description: `${values.name} has been registered successfully as an Admin for ${values.vidhansabha} constituency.`,
    });
    form.reset();
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Register Admin</h1>
          <p className="text-gray-500">Add a new admin for constituency management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
            <CardDescription>Enter the admin's personal and access details</CardDescription>
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
                        <Select 
                          onValueChange={(value) => handleStateChange(value)} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {states.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select 
                          onValueChange={(value) => handleDistrictChange(value)} 
                          defaultValue={field.value}
                          disabled={districts.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {districts.map((district) => (
                              <SelectItem key={district} value={district}>{district}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vidhansabha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vidhan Sabha Constituency*</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={vidhansabhas.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Vidhan Sabha constituency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vidhansabhas.map((constituency) => (
                              <SelectItem key={constituency} value={constituency}>{constituency}</SelectItem>
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
                  <FormLabel>Admin Photo</FormLabel>
                  <Input type="file" className="mt-1" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Register Admin</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RegisterAdmin;

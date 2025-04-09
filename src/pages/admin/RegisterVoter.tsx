
import React, { useState } from 'react';
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
  localbody: z.string(),
  ward: z.string(),
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

  // States for dependent dropdowns
  const [loksabhas, setLoksabhas] = useState<string[]>([]);
  const [vidhansabhas, setVidhansabhas] = useState<string[]>([]);
  const [localbodies, setLocalbodies] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [booths, setBooths] = useState<string[]>([]);

  // Mock data for dropdowns
  const states = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"];
  const districts = ["Mumbai", "Delhi", "Bangalore", "Chennai"];

  const allLoksabhas = {
    "Mumbai": ["Mumbai North", "Mumbai South", "Mumbai North East"],
    "Delhi": ["East Delhi", "New Delhi", "North Delhi"],
    "Bangalore": ["Bangalore Central", "Bangalore North", "Bangalore South"],
    "Chennai": ["Chennai Central", "Chennai North", "Chennai South"]
  };
  
  const allVidhansabhas = {
    "Mumbai North": ["Borivali", "Dahisar", "Kandivali East"],
    "Mumbai South": ["Worli", "Byculla", "Malabar Hill"],
    "East Delhi": ["Preet Vihar", "Vishwas Nagar", "Laxmi Nagar"],
    "Bangalore Central": ["Shivajinagar", "Shantinagar", "Gandhinagar"],
    "Chennai Central": ["Thousand Lights", "Harbour", "Chepauk-Triplicane"]
  };
  
  const allLocalBodies = {
    "Borivali": ["Borivali Municipal Corp", "Borivali Gram Panchayat"],
    "Dahisar": ["Dahisar Municipal Corp", "Dahisar Gram Panchayat"],
    "Worli": ["Worli Municipal Corp"],
    "Preet Vihar": ["Preet Vihar Municipal Corp"],
    "Shivajinagar": ["Shivajinagar Municipal Corp"],
    "Thousand Lights": ["Chennai Municipal Corp Zone 5"]
  };
  
  const allWards = {
    "Borivali Municipal Corp": ["Ward 1", "Ward 2", "Ward 3"],
    "Worli Municipal Corp": ["Ward A", "Ward B", "Ward C"],
    "Preet Vihar Municipal Corp": ["Ward 10", "Ward 11", "Ward 12"],
    "Shivajinagar Municipal Corp": ["Ward X", "Ward Y", "Ward Z"],
    "Chennai Municipal Corp Zone 5": ["Ward 101", "Ward 102", "Ward 103"]
  };
  
  const allBooths = {
    "Ward 1": ["Booth #101", "Booth #102", "Booth #103"],
    "Ward A": ["Booth #201", "Booth #202", "Booth #203"],
    "Ward 10": ["Booth #301", "Booth #302", "Booth #303"],
    "Ward X": ["Booth #401", "Booth #402", "Booth #403"],
    "Ward 101": ["Booth #501", "Booth #502", "Booth #503"]
  };

  // Get the user's constituency from auth context (or use a default)
  const userState = user?.state || "Maharashtra";
  const userDistrict = user?.district || "Mumbai";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      voter_id: "",
      dob: "",
      state: userState,
      district: userDistrict,
      loksabhaWard: "",
      vidhansabhaWard: "",
      localbody: "",
      ward: "",
      booth: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Initialize loksabha dropdown based on district
  React.useEffect(() => {
    if (userDistrict) {
      setLoksabhas(allLoksabhas[userDistrict as keyof typeof allLoksabhas] || []);
    }
  }, [userDistrict]);

  // Handle loksabha change to update vidhansabha dropdown
  const handleLoksabhaChange = (loksabha: string) => {
    form.setValue("loksabhaWard", loksabha);
    form.setValue("vidhansabhaWard", "");
    form.setValue("localbody", "");
    form.setValue("ward", "");
    form.setValue("booth", "");
    setVidhansabhas(allVidhansabhas[loksabha as keyof typeof allVidhansabhas] || []);
    setLocalbodies([]);
    setWards([]);
    setBooths([]);
  };

  // Handle vidhansabha change to update localbody dropdown
  const handleVidhansabhaChange = (vidhansabha: string) => {
    form.setValue("vidhansabhaWard", vidhansabha);
    form.setValue("localbody", "");
    form.setValue("ward", "");
    form.setValue("booth", "");
    setLocalbodies(allLocalBodies[vidhansabha as keyof typeof allLocalBodies] || []);
    setWards([]);
    setBooths([]);
  };

  // Handle localbody change to update ward dropdown
  const handleLocalbodyChange = (localbody: string) => {
    form.setValue("localbody", localbody);
    form.setValue("ward", "");
    form.setValue("booth", "");
    setWards(allWards[localbody as keyof typeof allWards] || []);
    setBooths([]);
  };

  // Handle ward change to update booth dropdown
  const handleWardChange = (ward: string) => {
    form.setValue("ward", ward);
    form.setValue("booth", "");
    setBooths(allBooths[ward as keyof typeof allBooths] || []);
  };

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
                    name="loksabhaWard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lok Sabha Constituency*</FormLabel>
                        <Select 
                          onValueChange={(value) => handleLoksabhaChange(value)} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Lok Sabha constituency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loksabhas.map((loksabha) => (
                              <SelectItem key={loksabha} value={loksabha}>{loksabha}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vidhansabhaWard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vidhan Sabha Constituency*</FormLabel>
                        <Select 
                          onValueChange={(value) => handleVidhansabhaChange(value)} 
                          defaultValue={field.value}
                          disabled={vidhansabhas.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Vidhan Sabha constituency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vidhansabhas.map((vidhansabha) => (
                              <SelectItem key={vidhansabha} value={vidhansabha}>{vidhansabha}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="localbody"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Body*</FormLabel>
                        <Select 
                          onValueChange={(value) => handleLocalbodyChange(value)} 
                          defaultValue={field.value}
                          disabled={localbodies.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select local body" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {localbodies.map((localbody) => (
                              <SelectItem key={localbody} value={localbody}>{localbody}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ward*</FormLabel>
                        <Select 
                          onValueChange={(value) => handleWardChange(value)} 
                          defaultValue={field.value}
                          disabled={wards.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ward" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {wards.map((ward) => (
                              <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={booths.length === 0}
                        >
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

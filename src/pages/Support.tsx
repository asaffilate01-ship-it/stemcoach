import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mail, MessageSquare, HelpCircle, Bug, Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTranslation } from "react-i18next";

type TicketForm = { name: string; email: string; category: string; subject: string; message: string };

const categories = [
  { value: "general", labelKey: "support.categories.general", icon: HelpCircle },
  { value: "bug", labelKey: "support.categories.bug", icon: Bug },
  { value: "feature", labelKey: "support.categories.feature", icon: Lightbulb },
  { value: "account", labelKey: "support.categories.account", icon: Mail },
  { value: "billing", labelKey: "support.categories.billing", icon: MessageSquare },
];

export default function Support() {
  const { t } = useTranslation();
  useDocumentTitle(`${t("support.title")} — STEMCoach`);
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<TicketForm>({
    resolver: zodResolver(z.object({
      name: z.string().min(2, t("support.validation.name")),
      email: z.string().email(t("support.validation.email")),
      category: z.string().min(1, t("support.validation.category")),
      subject: z.string().min(5, t("support.validation.subject")),
      message: z.string().min(20, t("support.validation.message")),
    })),
    defaultValues: {
      name: "",
      email: user?.email || "",
      category: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: TicketForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("support_tickets" as any).insert({
        user_id: user?.id || null,
        name: data.name,
        email: data.email,
        category: data.category,
        subject: data.subject,
        message: data.message,
      } as any);

      if (error) throw error;
      setSubmitted(true);
      toast.success(t("support.successToast"));
    } catch (err) {
      toast.error(t("support.failureToast"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="stem-label mb-3">{t("support.helpLabel")}</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("support.headingPrefix")} <span className="text-primary">{t("support.headingAccent")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              {t("support.description")}
            </p>
          </div>

          {/* Contact info cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <Card className="border-border/40">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t("support.emailUs")}</div>
                  <a href="mailto:support@stemcoach.app" className="text-sm text-primary hover:underline">
                    support@stemcoach.app
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t("support.responseTime")}</div>
                  <p className="text-sm text-muted-foreground">{t("support.responseTimeDesc")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket form or success */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t("support.submittedTitle")}</h2>
                  <p className="max-w-md text-muted-foreground">
                    {t("support.submittedDesc")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      form.reset();
                    }}
                    className="mt-4"
                  >
                    {t("support.submitAnother")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-xl">{t("support.formTitle")}</CardTitle>
                <CardDescription>
                  {t("support.formDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("support.name")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("support.namePlaceholder")} {...field} />
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
                            <FormLabel>{t("support.email")}</FormLabel>
                            <FormControl>
                              <Input placeholder="you@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("support.category")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("support.selectCategory")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {t(cat.labelKey)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("support.subject")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("support.subjectPlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("support.message")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("support.messagePlaceholder")}
                              className="min-h-[140px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          {t("support.submitting")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          {t("support.submitTicket")}
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

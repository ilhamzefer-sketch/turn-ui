import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { ManagedRoom, ManagedRoomService } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { Button } from "../../../shared/ui/Button";
import { TextAreaField } from "../../../shared/ui/TextAreaField";
import { TextField } from "../../../shared/ui/TextField";
import { StatusBadge } from "../ManagementUi";
import { apiMessage } from "../managementUtils";
import { nullableNumber, nullableText } from "../managementLabels";
import { serviceSchema, type ServiceFormValues } from "../schemas";

const emptyService: ServiceFormValues = { name: "", description: "", price: "" };

export function RoomServicesSection({ room }: { room: ManagedRoom }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ManagedRoomService | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const servicesQuery = useQuery({
    queryKey: ["management-room-services", room.id],
    queryFn: () => managementApi.roomServices(room.id),
  });
  const form = useForm<ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues: emptyService });
  const saveMutation = useMutation({
    mutationFn: (values: ServiceFormValues) => {
      const input = {
        name: values.name,
        description: nullableText(values.description),
        price: nullableNumber(values.price),
        active: true,
      };
      return editing
        ? managementApi.updateRoomService(room.id, editing.id, input)
        : managementApi.createRoomService(room.id, input);
    },
    onSuccess: async () => {
      setSuccessMessage(editing ? "Xidmət yeniləndi." : "Xidmət əlavə edildi.");
      setEditing(null);
      setEditorOpen(false);
      form.reset(emptyService);
      await queryClient.invalidateQueries({ queryKey: ["management-room-services", room.id] });
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: (serviceId: number) => managementApi.deactivateRoomService(room.id, serviceId),
    onSuccess: async () => {
      setSuccessMessage("Xidmət deaktiv edildi.");
      await queryClient.invalidateQueries({ queryKey: ["management-room-services", room.id] });
    },
  });
  const error = servicesQuery.error ?? saveMutation.error ?? deactivateMutation.error;

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyService);
    setEditorOpen(true);
  };
  const openEdit = (service: ManagedRoomService) => {
    setEditing(service);
    form.reset({ name: service.name, description: service.description ?? "", price: service.price === null ? "" : String(service.price) });
    setEditorOpen(true);
  };

  return (
    <div className="room-section-stack">
      {successMessage ? <div className="success-alert" role="status">{successMessage}</div> : null}
      {error ? <div className="form-alert" role="alert">{apiMessage(error, "Xidmət əməliyyatı tamamlanmadı.")}</div> : null}

      <section className="management-panel" aria-labelledby="services-title">
        <div className="section-heading">
          <div><p className="eyebrow">İstəyə bağlı məlumat</p><h2 id="services-title">Xidmətlər</h2></div>
          <Button onClick={openCreate}>Xidmət əlavə et</Button>
        </div>
        <p className="section-intro">Xidmətlər otağı axtarışda daha aydın göstərir. Növbə müddəti xidmətə görə deyil, otağın standart müddətinə görə hesablanır.</p>

        {editorOpen ? (
          <form className="management-form inset-editor" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} noValidate>
            <div className="management-form__grid">
              <TextField label="Xidmət adı" autoFocus error={form.formState.errors.name?.message} {...form.register("name")} />
              <TextField label="Qiymət (AZN, istəyə bağlı)" type="number" min="0" step="0.01" inputMode="decimal" error={form.formState.errors.price?.message} {...form.register("price")} />
            </div>
            <TextAreaField label="Qısa açıqlama (istəyə bağlı)" rows={3} error={form.formState.errors.description?.message} {...form.register("description")} />
            <div className="management-form__actions">
              <Button type="button" variant="secondary" onClick={() => setEditorOpen(false)}>Ləğv et</Button>
              <Button type="submit" loading={saveMutation.isPending}>{editing ? "Xidməti yenilə" : "Xidmət əlavə et"}</Button>
            </div>
          </form>
        ) : null}

        {servicesQuery.isPending ? <p role="status">Xidmətlər açılır…</p> : (
          <div className="service-list">
            {(servicesQuery.data ?? []).filter((service) => service.active).length === 0 ? <p>Hələ aktiv xidmət əlavə edilməyib.</p> : (servicesQuery.data ?? []).filter((service) => service.active).map((service) => (
              <article key={service.id}>
                <div><div className="management-list__title"><h3>{service.name}</h3><StatusBadge tone="success">Aktiv</StatusBadge></div><p>{service.description ?? "Açıqlama əlavə edilməyib."}</p></div>
                <strong>{service.price === null ? "Qiymət göstərilmir" : `${service.price.toFixed(2)} ${service.currency ?? "AZN"}`}</strong>
                <div className="management-list__actions">
                  <Button variant="secondary" onClick={() => openEdit(service)}>Düzəliş et</Button>
                  <Button variant="quiet" disabled={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(service.id)}>Deaktiv et</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

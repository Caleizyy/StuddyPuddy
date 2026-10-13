import { Schema, model, type InferSchemaType } from 'mongoose';

const availabilitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekday: { type: Number, required: true, min: 0, max: 6 },
    hoursAvailable: { type: Number, required: true, min: 0, max: 24 },
  },
  { timestamps: true },
);

export type Availability = InferSchemaType<typeof availabilitySchema>;
export const AvailabilityModel = model('Availability', availabilitySchema);

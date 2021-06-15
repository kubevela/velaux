import * as $protobuf from "protobufjs";
/** Namespace vela. */
export namespace vela {

    /** Namespace api. */
    namespace api {

        /** Namespace model. */
        namespace model {

            /** Properties of an Application. */
            interface IApplication {

                /** Application name */
                name?: (string|null);

                /** Application namespace */
                namespace?: (string|null);

                /** Application desc */
                desc?: (string|null);

                /** Application updatedAt */
                updatedAt?: (number|Long|null);

                /** Application components */
                components?: (vela.api.model.IComponentType[]|null);

                /** Application clusterName */
                clusterName?: (string|null);

                /** Application events */
                events?: (vela.api.model.IEvent[]|null);
            }

            /** Represents an Application. */
            class Application implements IApplication {

                /**
                 * Constructs a new Application.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.IApplication);

                /** Application name. */
                public name: string;

                /** Application namespace. */
                public namespace: string;

                /** Application desc. */
                public desc: string;

                /** Application updatedAt. */
                public updatedAt: (number|Long);

                /** Application components. */
                public components: vela.api.model.IComponentType[];

                /** Application clusterName. */
                public clusterName: string;

                /** Application events. */
                public events: vela.api.model.IEvent[];

                /**
                 * Creates a new Application instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Application instance
                 */
                public static create(properties?: vela.api.model.IApplication): vela.api.model.Application;

                /**
                 * Encodes the specified Application message. Does not implicitly {@link vela.api.model.Application.verify|verify} messages.
                 * @param message Application message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.IApplication, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Application message, length delimited. Does not implicitly {@link vela.api.model.Application.verify|verify} messages.
                 * @param message Application message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.IApplication, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Application message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Application
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.Application;

                /**
                 * Decodes an Application message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Application
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.Application;

                /**
                 * Verifies an Application message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Application message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Application
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.Application;

                /**
                 * Creates a plain object from an Application message. Also converts values to other types if specified.
                 * @param message Application
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.Application, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Application to JSON.
                 * @returns JSON object
                 */
                // public toJSON(): { [k: string]: any };
            }

            /** Properties of a ComponentType. */
            interface IComponentType {

                /** ComponentType name */
                name?: (string|null);

                /** ComponentType namespace */
                namespace?: (string|null);

                /** ComponentType type */
                type?: (string|null);

                /** ComponentType workload */
                workload?: (string|null);

                /** ComponentType desc */
                desc?: (string|null);

                /** ComponentType phase */
                phase?: (string|null);

                /** ComponentType health */
                health?: (boolean|null);

                /** ComponentType properties */
                properties?: (google.protobuf.IStruct|null);

                /** ComponentType traits */
                traits?: (vela.api.model.ITraitType[]|null);
            }

            /** Represents a ComponentType. */
            class ComponentType implements IComponentType {

                /**
                 * Constructs a new ComponentType.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.IComponentType);

                /** ComponentType name. */
                public name: string;

                /** ComponentType namespace. */
                public namespace: string;

                /** ComponentType type. */
                public type: string;

                /** ComponentType workload. */
                public workload: string;

                /** ComponentType desc. */
                public desc: string;

                /** ComponentType phase. */
                public phase: string;

                /** ComponentType health. */
                public health: boolean;

                /** ComponentType properties. */
                public properties?: (google.protobuf.IStruct|null);

                /** ComponentType traits. */
                public traits: vela.api.model.ITraitType[];

                /**
                 * Creates a new ComponentType instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ComponentType instance
                 */
                public static create(properties?: vela.api.model.IComponentType): vela.api.model.ComponentType;

                /**
                 * Encodes the specified ComponentType message. Does not implicitly {@link vela.api.model.ComponentType.verify|verify} messages.
                 * @param message ComponentType message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.IComponentType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ComponentType message, length delimited. Does not implicitly {@link vela.api.model.ComponentType.verify|verify} messages.
                 * @param message ComponentType message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.IComponentType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ComponentType message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ComponentType
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.ComponentType;

                /**
                 * Decodes a ComponentType message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ComponentType
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.ComponentType;

                /**
                 * Verifies a ComponentType message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ComponentType message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ComponentType
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.ComponentType;

                /**
                 * Creates a plain object from a ComponentType message. Also converts values to other types if specified.
                 * @param message ComponentType
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.ComponentType, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ComponentType to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TraitType. */
            interface ITraitType {

                /** TraitType type */
                type?: (string|null);

                /** TraitType desc */
                desc?: (string|null);

                /** TraitType properties */
                properties?: (google.protobuf.IStruct|null);
            }

            /** Represents a TraitType. */
            class TraitType implements ITraitType {

                /**
                 * Constructs a new TraitType.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.ITraitType);

                /** TraitType type. */
                public type: string;

                /** TraitType desc. */
                public desc: string;

                /** TraitType properties. */
                public properties?: (google.protobuf.IStruct|null);

                /**
                 * Creates a new TraitType instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TraitType instance
                 */
                public static create(properties?: vela.api.model.ITraitType): vela.api.model.TraitType;

                /**
                 * Encodes the specified TraitType message. Does not implicitly {@link vela.api.model.TraitType.verify|verify} messages.
                 * @param message TraitType message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.ITraitType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TraitType message, length delimited. Does not implicitly {@link vela.api.model.TraitType.verify|verify} messages.
                 * @param message TraitType message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.ITraitType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TraitType message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TraitType
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.TraitType;

                /**
                 * Decodes a TraitType message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TraitType
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.TraitType;

                /**
                 * Verifies a TraitType message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TraitType message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TraitType
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.TraitType;

                /**
                 * Creates a plain object from a TraitType message. Also converts values to other types if specified.
                 * @param message TraitType
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.TraitType, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TraitType to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of an Event. */
            interface IEvent {

                /** Event type */
                type?: (string|null);

                /** Event reason */
                reason?: (string|null);

                /** Event age */
                age?: (string|null);

                /** Event message */
                message?: (string|null);
            }

            /** Represents an Event. */
            class Event implements IEvent {

                /**
                 * Constructs a new Event.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.IEvent);

                /** Event type. */
                public type: string;

                /** Event reason. */
                public reason: string;

                /** Event age. */
                public age: string;

                /** Event message. */
                public message: string;

                /**
                 * Creates a new Event instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Event instance
                 */
                public static create(properties?: vela.api.model.IEvent): vela.api.model.Event;

                /**
                 * Encodes the specified Event message. Does not implicitly {@link vela.api.model.Event.verify|verify} messages.
                 * @param message Event message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Event message, length delimited. Does not implicitly {@link vela.api.model.Event.verify|verify} messages.
                 * @param message Event message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Event message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Event
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.Event;

                /**
                 * Decodes an Event message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Event
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.Event;

                /**
                 * Verifies an Event message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Event message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Event
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.Event;

                /**
                 * Creates a plain object from an Event message. Also converts values to other types if specified.
                 * @param message Event
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.Event, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Event to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of an ApplicationListResponse. */
            interface IApplicationListResponse {

                /** ApplicationListResponse applications */
                applications?: (vela.api.model.IApplication[]|null);
            }

            /** Represents an ApplicationListResponse. */
            class ApplicationListResponse implements IApplicationListResponse {

                /**
                 * Constructs a new ApplicationListResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.IApplicationListResponse);

                /** ApplicationListResponse applications. */
                public applications: vela.api.model.IApplication[];

                /**
                 * Creates a new ApplicationListResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ApplicationListResponse instance
                 */
                public static create(properties?: vela.api.model.IApplicationListResponse): vela.api.model.ApplicationListResponse;

                /**
                 * Encodes the specified ApplicationListResponse message. Does not implicitly {@link vela.api.model.ApplicationListResponse.verify|verify} messages.
                 * @param message ApplicationListResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.IApplicationListResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ApplicationListResponse message, length delimited. Does not implicitly {@link vela.api.model.ApplicationListResponse.verify|verify} messages.
                 * @param message ApplicationListResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.IApplicationListResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ApplicationListResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ApplicationListResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.ApplicationListResponse;

                /**
                 * Decodes an ApplicationListResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ApplicationListResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.ApplicationListResponse;

                /**
                 * Verifies an ApplicationListResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ApplicationListResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ApplicationListResponse
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.ApplicationListResponse;

                /**
                 * Creates a plain object from an ApplicationListResponse message. Also converts values to other types if specified.
                 * @param message ApplicationListResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.ApplicationListResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ApplicationListResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of an ApplicationResponse. */
            interface IApplicationResponse {

                /** ApplicationResponse application */
                application?: (vela.api.model.IApplication|null);
            }

            /** Represents an ApplicationResponse. */
            class ApplicationResponse implements IApplicationResponse {

                /**
                 * Constructs a new ApplicationResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.IApplicationResponse);

                /** ApplicationResponse application. */
                public application?: (vela.api.model.IApplication|null);

                /**
                 * Creates a new ApplicationResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ApplicationResponse instance
                 */
                public static create(properties?: vela.api.model.IApplicationResponse): vela.api.model.ApplicationResponse;

                /**
                 * Encodes the specified ApplicationResponse message. Does not implicitly {@link vela.api.model.ApplicationResponse.verify|verify} messages.
                 * @param message ApplicationResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.IApplicationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ApplicationResponse message, length delimited. Does not implicitly {@link vela.api.model.ApplicationResponse.verify|verify} messages.
                 * @param message ApplicationResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.IApplicationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ApplicationResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ApplicationResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.ApplicationResponse;

                /**
                 * Decodes an ApplicationResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ApplicationResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.ApplicationResponse;

                /**
                 * Verifies an ApplicationResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ApplicationResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ApplicationResponse
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.ApplicationResponse;

                /**
                 * Creates a plain object from an ApplicationResponse message. Also converts values to other types if specified.
                 * @param message ApplicationResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.ApplicationResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ApplicationResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }
}

/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of a Struct. */
        interface IStruct {

            /** Struct fields */
            fields?: ({ [k: string]: google.protobuf.IValue }|null);
        }

        /** Represents a Struct. */
        class Struct implements IStruct {

            /**
             * Constructs a new Struct.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IStruct);

            /** Struct fields. */
            public fields: { [k: string]: google.protobuf.IValue };

            /**
             * Creates a new Struct instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Struct instance
             */
            public static create(properties?: google.protobuf.IStruct): google.protobuf.Struct;

            /**
             * Encodes the specified Struct message. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @param message Struct message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Struct message, length delimited. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @param message Struct message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Struct message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Struct;

            /**
             * Decodes a Struct message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Struct;

            /**
             * Verifies a Struct message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Struct message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Struct
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Struct;

            /**
             * Creates a plain object from a Struct message. Also converts values to other types if specified.
             * @param message Struct
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Struct, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Struct to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Value. */
        interface IValue {

            /** Value nullValue */
            nullValue?: (google.protobuf.NullValue|null);

            /** Value numberValue */
            numberValue?: (number|null);

            /** Value stringValue */
            stringValue?: (string|null);

            /** Value boolValue */
            boolValue?: (boolean|null);

            /** Value structValue */
            structValue?: (google.protobuf.IStruct|null);

            /** Value listValue */
            listValue?: (google.protobuf.IListValue|null);
        }

        /** Represents a Value. */
        class Value implements IValue {

            /**
             * Constructs a new Value.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IValue);

            /** Value nullValue. */
            public nullValue?: (google.protobuf.NullValue|null);

            /** Value numberValue. */
            public numberValue?: (number|null);

            /** Value stringValue. */
            public stringValue?: (string|null);

            /** Value boolValue. */
            public boolValue?: (boolean|null);

            /** Value structValue. */
            public structValue?: (google.protobuf.IStruct|null);

            /** Value listValue. */
            public listValue?: (google.protobuf.IListValue|null);

            /** Value kind. */
            public kind?: ("nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue");

            /**
             * Creates a new Value instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Value instance
             */
            public static create(properties?: google.protobuf.IValue): google.protobuf.Value;

            /**
             * Encodes the specified Value message. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Value message, length delimited. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Value message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Value;

            /**
             * Decodes a Value message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Value;

            /**
             * Verifies a Value message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Value message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Value
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Value;

            /**
             * Creates a plain object from a Value message. Also converts values to other types if specified.
             * @param message Value
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Value, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Value to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** NullValue enum. */
        enum NullValue {
            NULL_VALUE = 0
        }

        /** Properties of a ListValue. */
        interface IListValue {

            /** ListValue values */
            values?: (google.protobuf.IValue[]|null);
        }

        /** Represents a ListValue. */
        class ListValue implements IListValue {

            /**
             * Constructs a new ListValue.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IListValue);

            /** ListValue values. */
            public values: google.protobuf.IValue[];

            /**
             * Creates a new ListValue instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListValue instance
             */
            public static create(properties?: google.protobuf.IListValue): google.protobuf.ListValue;

            /**
             * Encodes the specified ListValue message. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @param message ListValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListValue message, length delimited. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @param message ListValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListValue message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ListValue;

            /**
             * Decodes a ListValue message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ListValue;

            /**
             * Verifies a ListValue message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListValue
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ListValue;

            /**
             * Creates a plain object from a ListValue message. Also converts values to other types if specified.
             * @param message ListValue
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ListValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListValue to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}

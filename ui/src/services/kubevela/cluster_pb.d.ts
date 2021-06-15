import * as $protobuf from "protobufjs";
import { Long } from "protobufjs";
/** Namespace vela. */
export namespace vela {

    /** Namespace api. */
    namespace api {

        /** Namespace model. */
        namespace model {

            /** Properties of a Cluster. */
            interface ICluster {

                /** Cluster name */
                name?: (string|null);

                /** Cluster desc */
                desc?: (string|null);

                /** Cluster updatedAt */
                updatedAt?: (number|Long|null);

                /** Cluster kubeconfig */
                kubeconfig?: (string|null);
            }

            /** Represents a Cluster. */
            class Cluster implements ICluster {

                /**
                 * Constructs a new Cluster.
                 * @param [properties??] Properties to set
                 */
                constructor(properties?: vela.api.model.ICluster);

                /** Cluster name. */
                public name: string;

                /** Cluster desc. */
                public desc: string;

                /** Cluster updatedAt. */
                public updatedAt: (number|Long);

                /** Cluster kubeconfig. */
                public kubeconfig: string;

                /**
                 * Creates a new Cluster instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Cluster instance
                 */
                public static create(properties?: vela.api.model.ICluster): vela.api.model.Cluster;

                /**
                 * Encodes the specified Cluster message. Does not implicitly {@link vela.api.model.Cluster.verify|verify} messages.
                 * @param message Cluster message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.ICluster, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Cluster message, length delimited. Does not implicitly {@link vela.api.model.Cluster.verify|verify} messages.
                 * @param message Cluster message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.ICluster, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Cluster message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Cluster
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.Cluster;

                /**
                 * Decodes a Cluster message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Cluster
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.Cluster;

                /**
                 * Verifies a Cluster message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Cluster message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Cluster
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.Cluster;

                /**
                 * Creates a plain object from a Cluster message. Also converts values to other types if specified.
                 * @param message Cluster
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.Cluster, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Cluster to JSON.
                 * @returns JSON object
                 */
                // public toJSON(): { [k: string]: any };
            }

            /** Properties of a ClusterListResponse. */
            interface IClusterListResponse {

                /** ClusterListResponse clusters */
                clusters?: (vela.api.model.ICluster[]|null);
            }

            /** Represents a ClusterListResponse. */
            class ClusterListResponse implements IClusterListResponse {

                /**
                 * Constructs a new ClusterListResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.IClusterListResponse);

                /** ClusterListResponse clusters. */
                public clusters: vela.api.model.ICluster[];

                /**
                 * Creates a new ClusterListResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ClusterListResponse instance
                 */
                public static create(properties?: vela.api.model.IClusterListResponse): vela.api.model.ClusterListResponse;

                /**
                 * Encodes the specified ClusterListResponse message. Does not implicitly {@link vela.api.model.ClusterListResponse.verify|verify} messages.
                 * @param message ClusterListResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.IClusterListResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ClusterListResponse message, length delimited. Does not implicitly {@link vela.api.model.ClusterListResponse.verify|verify} messages.
                 * @param message ClusterListResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.IClusterListResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ClusterListResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ClusterListResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.ClusterListResponse;

                /**
                 * Decodes a ClusterListResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ClusterListResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.ClusterListResponse;

                /**
                 * Verifies a ClusterListResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ClusterListResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ClusterListResponse
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.ClusterListResponse;

                /**
                 * Creates a plain object from a ClusterListResponse message. Also converts values to other types if specified.
                 * @param message ClusterListResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.ClusterListResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ClusterListResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ClusterResponse. */
            interface IClusterResponse {

                /** ClusterResponse cluster */
                cluster?: (vela.api.model.ICluster|null);
            }

            /** Represents a ClusterResponse. */
            class ClusterResponse implements IClusterResponse {

                /**
                 * Constructs a new ClusterResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: vela.api.model.IClusterResponse);

                /** ClusterResponse cluster. */
                public cluster?: (vela.api.model.ICluster|null);

                /**
                 * Creates a new ClusterResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ClusterResponse instance
                 */
                public static create(properties?: vela.api.model.IClusterResponse): vela.api.model.ClusterResponse;

                /**
                 * Encodes the specified ClusterResponse message. Does not implicitly {@link vela.api.model.ClusterResponse.verify|verify} messages.
                 * @param message ClusterResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: vela.api.model.IClusterResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ClusterResponse message, length delimited. Does not implicitly {@link vela.api.model.ClusterResponse.verify|verify} messages.
                 * @param message ClusterResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: vela.api.model.IClusterResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ClusterResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ClusterResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): vela.api.model.ClusterResponse;

                /**
                 * Decodes a ClusterResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ClusterResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): vela.api.model.ClusterResponse;

                /**
                 * Verifies a ClusterResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ClusterResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ClusterResponse
                 */
                public static fromObject(object: { [k: string]: any }): vela.api.model.ClusterResponse;

                /**
                 * Creates a plain object from a ClusterResponse message. Also converts values to other types if specified.
                 * @param message ClusterResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: vela.api.model.ClusterResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ClusterResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }
}

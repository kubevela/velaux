import { vela } from "@/services/kubevela/cluster_pb";

export class ClusterType extends vela.api.model.Cluster {

  constructor(properties: vela.api.model.ICluster) {
    super(properties)
    this.name = properties.name as any
    this.desc = properties.desc as any
    this.updatedAt =  properties.updatedAt as any
    this.kubeconfig = properties.kubeconfig as any
    // console.log(properties)
    // console.log(this)
  }

  toJSON(): { [p: string]: any }
  {
    console.log(this)
    return {
      "name":        this.name,
      "desc":        this.desc,
      "updateAt":    this.updatedAt,
      "kubeconfig":  this.kubeconfig,
    };
  }
}


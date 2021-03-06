sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/m/MessageBox",
		"./utilities",
		"sap/ui/core/routing/History",
		"sap/ui/model/json/JSONModel"
	], function (BaseController, MessageBox, Utilities, History, JSONModel) {
		"use strict";

		var oStorage;
		var dialogAssinatura = {};
		var imagem64 = "";
		var data = "";

		return BaseController.extend("com.sap.build.standard.formInspecaoDeVeiculos.controller.Conclusao", {
			handleRouteMatched: function (oEvent) {
				var oParams = {};
				oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				if (oStorage.get("Crud") !== null) {
					if (oStorage.get("Crud").operacao === "create") {
						if (oStorage.get("Crud").pageReset === "conclusao") {
							this.resetPage();
							oStorage.put("Crud", {
								operacao: "create",
								pageReset: "identificacao"
							});
						}
					} else if (oStorage.get("Crud").operacao === "update") {
						if (oStorage.get("Crud").pageReset === "conclusao") {
							var sPath = oStorage.get("Crud").sPath;
							this.preenchePage(sPath);
							oStorage.put("Crud", {
								operacao: "update",
								pageReset: "identificacao",
								sPath: sPath
							});
						}
					}
				}
				if (oEvent.mParameters.data.context) {
					this.sContext = oEvent.mParameters.data.context;
					var oPath;
					if (this.sContext) {
						oPath = {
							path: "/" + this.sContext,
							parameters: oParams
						};
						this.getView().bindObject(oPath);
					}
				}
				
				this.aRadioButtonGroupIds = ["resultadoRb"];
				this.handleRadioButtonGroupsSelectedIndex();
			},
			resetPage: function () {
				this.getView().byId("obsInput").setValue("");
				this.getView().byId("dataInput").setValue("");
				this.getView().byId("dataInput").setDateValue(new Date());
				this.imagem64 = "";
				this.getView().byId("btnAssinatura").setType("Reject");
			},
			preenchePage: function (sPath) {
				var oView = this.getView(),
					sUrl = "/sap/opu/odata/sap/ZGW_VISTORIA_SRV",
					oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
				var caminho = "com.sap.build.standard.formInspecaoDeVeiculos.view.BusyDialog";
				var oDialog = sap.ui.xmlfragment(caminho, this);
				oDialog.open();
				oModel.read(sPath, {
					success: function (oData) {
						if (oData.Resultado) {
							oView.byId("resultadoRb").setSelectedIndex(0);
						} else {
							oView.byId("resultadoRb").setSelectedIndex(1);
						}
						oData.DataCarregamento.setTime(oData.DataCarregamento.getTime() + 3 * 60 * 60 * 1000);
						oView.byId("dataInput").setValue(oData.DataCarregamento);
						oView.byId("dataInput").setDateValue(oData.DataCarregamento);
						oView.byId("obsInput").setValue(oData.Observacoes);
						oDialog.close();
					},
					error: function (oError) {
						oDialog.close();
						MessageBox.error("erro ao prencheer campos");
						var rota = this.getOwnerComponent().getRouter();
						rota.navTo("Menu", false);
					}
				});
			},
			handleRadioButtonGroupsSelectedIndex: function () {
				var that = this;
				this.aRadioButtonGroupIds.forEach(function (sRadioButtonGroupId) {
					var oRadioButtonGroup = that.byId(sRadioButtonGroupId);
					var oButtonsBinding = oRadioButtonGroup ? oRadioButtonGroup.getBinding("buttons") : undefined;
					if (oButtonsBinding) {
						var oSelectedIndexBinding = oRadioButtonGroup.getBinding("selectedIndex");
						var iSelectedIndex = oRadioButtonGroup.getSelectedIndex();
						oButtonsBinding.attachEventOnce("change", function () {
							if (oSelectedIndexBinding) {
								oSelectedIndexBinding.refresh(true);
							} else {
								oRadioButtonGroup.setSelectedIndex(iSelectedIndex);
							}
						});
					}
				});
			},
			_onPageNavButtonPress: function () {
				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();
				var oQueryParams = this.getQueryParameters(window.location);
				if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
					window.history.go(-1);
				} else {
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("default", true);
				}
			},
			
			getQueryParameters: function (oLocation) {
				var oQuery = {};
				var aParams = oLocation.search.substring(1).split("&");
				for (var i = 0; i < aParams.length; i++) {
					var aPair = aParams[i].split("=");
					oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
				}
				return oQuery;
			},
			
			convertTextToIndexFormatter: function (sTextValue) {
				var oRadioButtonGroup = this.byId("resultadoRb");
				var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
				if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
					var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
					return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
						oButtonContext) {
						return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
					});
				} else {
					return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
						return oButton.getText() === sTextValue;
					});
				}
			},
			_onRadioButtonGroupSelect: function () {},
			handleLiveChange: function (oEvent) {
				var id = oEvent.getParameter("id").split("application-BUILD-prototype-component---Conclusao--");
				var input = this.getView().byId(id[1]);
				input.setValueState("None");
				input.setValue(input.getValue().toUpperCase());
			},
			getDados: function () {
				// oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var identificacao = oStorage.get("identificacao"),
					inspecao = oStorage.get("inspecao");
				var id = "-1";
				if (oStorage.get("Crud") !== null && oStorage.get("Crud").operacao === "update") {
					id = oStorage.get("Crud").sPath.split("'")[1];
				}
				var dados = {
					Id: id,
					TipoVeiculo: identificacao.tipoVeiculo,
					Veiculo: identificacao.veiculo,
					Reboque1: identificacao.reboque1,
					Reboque2: identificacao.reboque2,
					Reboque3: identificacao.reboque3,
					Carroceria: inspecao.carroceria,
					Motorista: identificacao.lifnr,
					Nome: identificacao.nome_motorista,
					Cpf: identificacao.cpf,
					C1UltimaCarga: inspecao.ultimas_cargas.compartimento1.ulti_carga,
					C1PenultimaCarga: inspecao.ultimas_cargas.compartimento1.penu_carga,
					C1AntepeultCarga: inspecao.ultimas_cargas.compartimento1.ante_carga,
					C2UltimaCarga: inspecao.ultimas_cargas.compartimento2.ulti_carga,
					C2PenultimaCarga: inspecao.ultimas_cargas.compartimento2.penu_carga,
					C2AntepeultCarga: inspecao.ultimas_cargas.compartimento2.ante_carga,
					// Sopro com ar comprimido (A)
					C1SoproAr: inspecao.tipo_limpeza.tipo_limpeza_01.compartimento1,
					C2SoproAr: inspecao.tipo_limpeza.tipo_limpeza_01.compartimento2,
					// Varredura (A)
					C1Varredura: inspecao.tipo_limpeza.tipo_limpeza_02.compartimento1,
					C2Varredura: inspecao.tipo_limpeza.tipo_limpeza_02.compartimento2,
					// Lavagem com água (B)
					C1Lavagem: inspecao.tipo_limpeza.tipo_limpeza_03.compartimento1,
					C2Lavagem: inspecao.tipo_limpeza.tipo_limpeza_03.compartimento2,
					// Vaporização (com vapor d'água) (C)
					C1Vaporizacao: inspecao.tipo_limpeza.tipo_limpeza_04.compartimento1,
					C2Vaporizacao: inspecao.tipo_limpeza.tipo_limpeza_04.compartimento2,
					// Lavagem com água e agente de limpeza (C)
					C1Lavagem02: inspecao.tipo_limpeza.tipo_limpeza_05.compartimento1,
					C2Lavagem02: inspecao.tipo_limpeza.tipo_limpeza_05.compartimento2,
					// Lavagem com água e agente de desinfecção (D)
					C1Lavagem03: inspecao.tipo_limpeza.tipo_limpeza_06.compartimento1,
					C2Lavagem03: inspecao.tipo_limpeza.tipo_limpeza_06.compartimento2,
					CondicaoVeiculo01: inspecao.condicao_limpeza.condicoe01,
					CondicaoVeiculo02: inspecao.condicao_limpeza.condicoe02,
					CondicaoVeiculo03: inspecao.condicao_limpeza.condicoe03,
					CondicaoVeiculo04: inspecao.condicao_limpeza.condicoe04,
					CondicaoVeiculo05: inspecao.condicao_limpeza.condicoe05,
					CondicaoVeiculo06: inspecao.condicao_limpeza.condicoe06,
					CondicaoVeiculo07: inspecao.condicao_limpeza.condicoe07,
					CondicaoVeiculo08: inspecao.condicao_limpeza.condicoe08,
					CondicaoVeiculo09: inspecao.condicao_limpeza.condicoe09,
					CondicaoVeiculo10: inspecao.condicao_limpeza.condicoe10,
					CondicaoVeiculo11: inspecao.condicao_limpeza.condicoe11,
					CondicaoVeiculo12: inspecao.condicao_limpeza.condicoe12,
					CondicaoVeiculo13: inspecao.condicao_limpeza.condicoe13,
					Usuario: sap.ushell.Container.getUser().getFirstName(),
					Status: "A",
					Resultado: this.getView().byId("resultadoRb").getSelectedIndex() === 0 ? true : false,
					DataCarregamento: this.getView().byId("dataInput").getProperty("dateValue"),
					Observacoes: this.getView().byId("obsInput").getValue()
				};
				return dados;
			},
			salvaVistoria: function () {
				
				var dados = this.getDados();
				var sUrl = "/sap/opu/odata/sap/ZGW_VISTORIA_SRV",
					oModel = new sap.ui.model.odata.ODataModel(sUrl, true),
					inspecao = oStorage.get("inspecao"),
					rota = this.getOwnerComponent().getRouter(),
					oDialog = sap.ui.xmlfragment("com.sap.build.standard.formInspecaoDeVeiculos.view.BusyDialog", this);
				if (this.getView().byId("dataInput").getValue() !== "") {
					oDialog.open();
					jQuery.sap.delayedCall(500, this, function () {
						oModel.create("/Vistoria", dados, null, function (oData, oResponse) {
							jQuery.each(inspecao.produtos.chaves, function (i, produto) {
								dados = {
									IdVistoria: oData.Id,
									IdProduto: produto
								};
								oModel.create("/AuxVistoria", dados, {
									success: function () {},
									error: function () {
										oDialog.close();
										MessageBox.error("Erro ao cadastrar o veiculo!");
									}
								});
							});
							MessageBox.success("Cadastrado com sucesso!", {
								onClose: function (sActionClicked) {
									oDialog.close();
									oStorage.clear();
									oStorage.removeAll();
									oStorage.put("Crud", {
										operacao: "create",
										pageReset: "identificacao"
									});
									rota.navTo("Menu", false);
								}
							});
						}, function () {
							oDialog.close();
							MessageBox.error("Erro ao cadastrar o veiculo!");
						});
					});
				} else {
					oDialog.close();
					MessageBox.warning("\xC9 Necess\xE1rio definir uma data para salvar.");
				}
			},
			atualizaVistoria: function () {
				var dados = this.getDados();
				var sUrl = "/sap/opu/odata/sap/ZGW_VISTORIA_SRV",
					oModel = new sap.ui.model.odata.ODataModel(sUrl, true),
					inspecao = oStorage.get("inspecao"),
					rota = this.getOwnerComponent().getRouter(),
					id = oStorage.get("Crud").sPath.split("'")[1],
					sPath = oStorage.get("Crud").sPath,
					oDialog = sap.ui.xmlfragment("com.sap.build.standard.formInspecaoDeVeiculos.view.BusyDialog", this);
				if (this.getView().byId("dataInput").getValue() !== "") {
					oDialog.open();
					jQuery.sap.delayedCall(500, this, function () {
						oModel.remove("/AuxVistoria('" + id + "')", {
							method: "DELETE",
							success: function (data) {},
							error: function (e) {
								oDialog.close();
								MessageBox.error("Erro ao atualizar vistoria!");
							}
						});
						oModel.update(sPath, dados, {
							method: "PUT",
							success: function (data) {
								jQuery.each(inspecao.produtos.chaves, function (i, produto) {
									dados = {
										IdVistoria: id,
										IdProduto: produto
									};
									oModel.create("/AuxVistoria", dados, {
										success: function () {},
										error: function () {
											oDialog.close();
											MessageBox.error("Erro ao cadastrar o veiculo!");
										}
									});
								});
								MessageBox.success("Atualizado com sucesso!", {
									onClose: function (sActionClicked) {
										oDialog.close();
										oStorage.clear();
										oStorage.removeAll();
										oStorage.put("Crud", {
											operacao: "create",
											pageReset: "identificacao"
										});
										rota.navTo("Menu", false);
									}
								});
							},
							error: function (e) {
								oDialog.close();
								MessageBox.error("Erro ao atualizar vistoria!");
							}
						});
					});
				} else {
					oDialog.close();
					MessageBox.warning("\xC9 Necess\xE1rio definir uma data para salvar.");
				}
			},
			_inputDados: function () {
				oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				if(this.imagem64 !== ""){
					if (oStorage.get("Crud") === null || oStorage.get("Crud").operacao === "create") {
						this.salvaVistoria();
					} else if (oStorage.get("Crud").operacao === "update") {
						this.atualizaVistoria();
					}	
				}else{
					MessageBox.warning("É necessário preencher o campo assinatura");
				}
				
			},
			_data: {
				"date": new Date()
			},

			onReset: function (oEvent) {
				// this.geraSignaturePad();
				var canvas = document.getElementById("signature-pad");
				var context = canvas.getContext("2d");
				context.clearRect(0, 0, canvas.width, canvas.height);
				var signaturePad = new SignaturePad(document.getElementById("signature-pad"), {
					backgroundColor: "#ffffff",
					penColor: "rgb(0, 0, 0)",
					penWidth: "1"
				});
				sap.ui.getCore().byId("idAssinatura").setShowResetEnabled(true)
			},

			geraSignaturePad: function () {

				var width = screen.width;
				if (this.getDevice() === 1) {
					width -= 300;
				} else {
					width -= 110;
				}
				var html =
					"<style>" +
						".wrapper {" +
							"position: relative;" +
							"width:" + width + "px;" +
							"height: 200px;" +
							"margin: 5px;" +
							"-moz-user-select: none;" +
							"-webkit-user-select: none;" +
							"-ms-user-select: none;" +
							"user-select: none;" +
						"}" +
						".signature-pad {" +
							"position: absolute;" +
							"left: 0;" +
							"top: 0;" +
							"width:" + width + "px;" +
							"height: 200px;" +
							"background-color: white;" +
							"border: 1px solid;" +
							"border-radius: 3px;" +
							"border-color: #ababab;" +
						"}" +
					"</style>" +
					"<div class='wrapper'>" +
						"<canvas id= 'signature-pad' class= 'signature-pad' width= " + width + " height= 200></canvas>" +
					"</div>";

				var core = sap.ui.getCore().byId("html");
				core.setContent(html);

			},

			preencheSignaturePad: function () {
				var signaturePad = new SignaturePad(document.getElementById("signature-pad"), {
					backgroundColor: "#ffffff",
					penColor: "rgb(0, 0, 0)"
				});
				if(this.imagem64 !== "") signaturePad.fromDataURL(this.imagem64);
			},

			onOK: function (oEvent) {
				this.salvaCanvas(oEvent);
				this.onCancel(oEvent);
				if(this.imagem64 !== "") this.getView().byId("btnAssinatura").setType("Accept");
			},

			salvaCanvas: function (oEvent) {
				var canvas = document.getElementById("signature-pad");
				this.imagem64 = canvas.toDataURL('image/jpeg');
				
			},

			getDevice: function () {
				if (sap.ui.Device.system.desktop) return 1;
				if (sap.ui.Device.system.phone) return 2;
				if (sap.ui.Device.system.tablet) return 3;
			},

			getOrientatio: function () {
				if (sap.ui.Device.orientation.landscape) return 1;
				if (sap.ui.Device.orientation.portrait) return 2;
			},

			onCancel: function (oEvent) {
				this.dialogAssinatura = {};
				oEvent.getSource().close();
				oEvent.getSource().destroy();
			},

			onInit: function () {

				oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oModel = new JSONModel(this._data);
				this.getView().byId("dataInput").setModel(oModel);
				this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				this.oRouter.getTarget("Conclusao").attachDisplay(jQuery.proxy(this.handleRouteMatched, this)); // var that = this;
			},

			abreFragment: function () {
				var caminho = "com.sap.build.standard.formInspecaoDeVeiculos.view.DialogSignature";
				this.dialogAssinatura = sap.ui.xmlfragment(caminho, this);
				this.getView().addDependent(this.dialogAssinatura);
				this.dialogAssinatura.open();
			},

			abreAssinatura: function (oEvent) {
				if (this.getDevice() !== 1) {
					if (this.getOrientatio() === 1) {
						this.abreFragment();
					} else {
						sap.m.MessageBox.show("É necessário usar o dispositivo no modo Paisagem para abrir o campo Assinatura. Por favor, Vire o seu Dispositivo.", sap.m.MessageBox
							.Icon.INFORMATION);
					}
				} else {
					this.abreFragment();
				}
			}
		});
	}, /* bExport= */
	true);;
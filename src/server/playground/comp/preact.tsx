/** @jsx h */
import { Fragment, h, useEffect, useState } from "../reactDeps.ts";
import { E2E } from "./E2E.tsx";
import { History } from "./History.tsx";
import GraphIcon from "./icon/GraphIcon.tsx";
import HistoryIcon from "./icon/HistoryIcon.tsx";
import SettingIcon from "./icon/SettingIcon.tsx";
import TestIcon from "./icon/TestIcon.tsx";
import { Main } from "./Main.tsx";
import { useLesan } from "./ManagedLesanContext.tsx";
import Modal from "./Modal.tsx";
import { Setting } from "./Setting.tsx";
import useModal from "./useModal.tsx";

const getSchemasAPI = ({ baseUrl }: { baseUrl: string }) =>
  fetch(`${baseUrl}playground/static/get/schemas`).then((res) => res.json());

enum MODAL_TYPES {
  HISTORY = "HISTORY",
  GRAPH = "GRAPH",
  SETTING = "SETTING",
  E2E_TEST = "E2E TEST",
}

export const Page = () => {
  const { isOpen, toggleModal } = useModal();

  const {
    tabsData,
    setTabsData,
    activeTab,
    actsObj,
    addTab,
    setActiveTab,
    setService,
    setMethod,
    setSchema,
    setAct,
    setPostFields,
    setGetFields,
    setFormData,
    setHistory,
    setResponse,
    resetGetFields,
    closeTab,
    resetPostFields,
    setSchemasObj,
    setActsObj,
  } = useLesan();

  const [active, setActive] = useState("");

  const parsedWindowUrl = () => {
    return window && window.location
      ? `${new URL(window.location.href).origin}/`
      : "http://localhost:1366/";
  };

  const [urlAddress, setUrlAddress] = useState("");

  useEffect(() => {
    configUrl(parsedWindowUrl());

    // const localTabsData = localStorage.getItem("localTabsData");
    // console.log("localTabsData", JSON.parse(localTabsData!));
    // if (localTabsData) setTabsData(JSON.parse(localTabsData));

    const localHistory = JSON.parse(localStorage.getItem("localHistory")!);
    if (localHistory) setHistory(localHistory);
  }, []);

  const configUrl = (address?: string) => {
    address && setUrlAddress(address);

    setService({ data: "", index: activeTab });
    setMethod({ data: "", index: activeTab });
    setSchema({ data: "", index: activeTab });
    resetGetFields(activeTab);
    resetPostFields(activeTab);
    setFormData({ data: {}, index: activeTab });

    getSchemasAPI({ baseUrl: address ? address : urlAddress }).then(
      ({ schemas, acts }) => {
        setActsObj(acts);
        setSchemasObj(schemas);

        // TODO: ۱.قصد داشتیم که اطلاعات تب های مختلف را در لوکال استورج  ذخیره کنیم تا با رفرش کردن مرورگر این اطلاعات از دست نرود
        // ۲.مشکلی که پیش آمد این بود که اگر اطلاعات و کانفیگ موجود در تب ها که در لوکال استورج ذخیره شده بود و میخواستیم فرخوانی اش کنیم موضوعی که باید به آن توجه می شد این بود که ممکن بود کانفیگ توسط یوزر عوض شده باشد و با کانفیگ ذخیره شده در لوال استورج مطابقت نداشته باشد  و لذا به ارور می خوردیم
        // ۳.برای حل این موضوع باید اطلاعات چک و بررسی می شد
        // ۴.انشاءالله
        console.log("schema:", schemas);
        console.log("actsobj:", acts);
        const localTabsData = localStorage.getItem("localTabsData");
        console.log("localTabsData", JSON.parse(localTabsData!));
        // if (localTabsData) setTabsData(JSON.parse(localTabsData));

        const re = () => {
          JSON.parse(localTabsData!).map((o: any) => {
            if (
              typeof o.service === "string" &&
              typeof o.method === "string" &&
              typeof o.schema === "string" &&
              typeof o.act === "string"
            ) {
              setTabsData(JSON.parse(localTabsData!));
            }
          });
        };

        if (localTabsData) {
          re();
        }
      }
    );
  };

  const setFormFromHistory = (request: any) => {
    setService({ data: request.body.service, index: activeTab });
    setMethod({ data: request.body.contents, index: activeTab });
    setSchema({ data: request.body.wants.model, index: activeTab });
    setAct({ data: request.body.wants.act, index: activeTab });

    const actObj = (actsObj as any)[request.body.service][
      request.body.contents
    ][request.body.wants.model][request.body.wants.act]["validator"]["schema"];

    setGetFields({ data: actObj["get"]["schema"], index: activeTab });
    setPostFields({ data: actObj["set"]["schema"], index: activeTab });

    setResponse({ data: null, index: activeTab });
    const generateFormData = (
      formData: Record<string, any>,
      returnFormData: Record<string, any>,
      keyname: string
    ) => {
      for (const key in formData) {
        typeof formData[key] === "object"
          ? generateFormData(
              formData[key],
              returnFormData,
              keyname ? `${keyname}.${key}` : key
            )
          : (returnFormData[`${keyname}.${key}`] = formData[key]);
      }
      return returnFormData;
    };

    const historyFromData = generateFormData(request.body.details, {}, "");

    setFormData({ data: historyFromData, index: activeTab });

    toggleModal();
  };

  const modalBtnClickHandler = (type: MODAL_TYPES) => {
    setActive(type);
    toggleModal();
  };

  return (
    <div className="cnt">
      <div className="tabs-container" style={{ display: "flex" }}>
        {tabsData.map((tab, index) => (
          <Fragment>
            <div
              className="tab-name"
              data-tab={activeTab === index}
              onClick={() => {
                setActiveTab(index);
              }}
            >
              {tabsData[index].act
                ? `${tabsData[index].schema} | ${tabsData[index].act}`
                : tabsData[index].schema
                ? `${tabsData[index].method} | ${tabsData[index].schema}`
                : tabsData[index].method
                ? `${tabsData[index].service} | ${tabsData[index].method}`
                : tabsData[index].service
                ? tabsData[index].service
                : `Tab ${index}`}
              <span
                className="add-tab tab-close"
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(index);
                }}
              >
                x
              </span>
            </div>
          </Fragment>
        ))}
        <span
          className="add-tab"
          onClick={() => {
            addTab(null);
            // TODO: مربوط به تودو بالایی
            localStorage.setItem("localTabsData", JSON.stringify(tabsData));
          }}
        >
          +
        </span>
      </div>
      <Main urlAddress={urlAddress} />

      <div className="sidebar__btns-wrapper">
        <span
          className="btn-modal"
          onClick={() => modalBtnClickHandler(MODAL_TYPES.HISTORY)}
        >
          <span className="tooltip-text">History</span>
          <HistoryIcon />
        </span>
        <span
          className="btn-modal"
          onClick={() => modalBtnClickHandler(MODAL_TYPES.SETTING)}
        >
          <span className="tooltip-text">Setting</span>
          <SettingIcon />
        </span>
        <span
          className="btn-modal"
          onClick={() => modalBtnClickHandler(MODAL_TYPES.GRAPH)}
        >
          <span className="tooltip-text">Graph</span>
          <GraphIcon />
        </span>
        <span
          className="btn-modal"
          onClick={() => modalBtnClickHandler(MODAL_TYPES.E2E_TEST)}
        >
          <span className="tooltip-text">Test</span>
          <TestIcon />
        </span>
      </div>

      {isOpen && (
        <Modal toggle={toggleModal} title={active}>
          {active === MODAL_TYPES.HISTORY ? (
            <History setFormFromHistory={setFormFromHistory} />
          ) : active === MODAL_TYPES.SETTING ? (
            <Setting configUrl={configUrl} />
          ) : active === MODAL_TYPES.E2E_TEST ? (
            <E2E baseUrl={urlAddress} />
          ) : (
            <Fragment></Fragment>
          )}
        </Modal>
      )}
    </div>
  );
};

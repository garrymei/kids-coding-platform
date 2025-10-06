import { useState } from 'react';
import { useFormValidation, FormField, FormInput, FormTextarea, FormSelect } from '@kids/forms';
import { Button, Card } from '@kids/ui-kit';
import { httpClient } from '../services/http';
import { z } from 'zod';

const requestAccessSchema = z.object({
  studentEmail: z.string().email('璇疯緭鍏ユ湁鏁堢殑閭鍦板潃'),
  purpose: z.string().min(1, '璇烽€夋嫨鐢宠鐩殑'),
  reason: z.string().min(10, '鐢宠鐞嗙敱鑷冲皯闇€瑕?0涓瓧绗?),
  duration: z.string().optional(),
});

type RequestAccessData = z.infer<typeof requestAccessSchema>;

interface RequestAccessFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const purposeOptions = [
  { value: 'parent-view', label: '鏌ョ湅瀛︿範杩涘害' },
  { value: 'parent-supervision', label: '瀛︿範鐩戠潱' },
  { value: 'parent-support', label: '瀛︿範鏀寔' },
  { value: 'parent-report', label: '鐢熸垚瀛︿範鎶ュ憡' },
];

const durationOptions = [
  { value: '1w', label: '1鍛? },
  { value: '1m', label: '1涓湀' },
  { value: '3m', label: '3涓湀' },
  { value: '6m', label: '6涓湀' },
  { value: '1y', label: '1骞? },
  { value: 'permanent', label: '姘镐箙' },
];

type DurationValue = (typeof durationOptions)[number]['value'];
const DEFAULT_DURATION: DurationValue = '3m';

export function RequestAccessForm({ onSuccess, onCancel }: RequestAccessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useFormValidation<RequestAccessData>({
    schema: requestAccessSchema,
    defaultValues: {
      studentEmail: '',
      purpose: 'parent-view',
      reason: '',
      duration: '3m',
    },
  });

  const selectedPurpose = watch('purpose');

  const onSubmit = async (data: RequestAccessData) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');

      // 璁＄畻杩囨湡鏃堕棿
      const duration = data.duration ?? DEFAULT_DURATION;

      const expiresAt =
        duration === 'permanent'
          ? null
          : new Date(Date.now() + getDurationMs(duration)).toISOString();

      await httpClient.post<
        void,
        { studentEmail: string; purpose: string; reason: string; expiresAt: string | null }
      >('/relationships/request-parent-access', {
        body: {
          studentEmail: data.studentEmail,
          purpose: data.purpose,
          reason: data.reason,
          expiresAt,
        },
      });

      setSubmitStatus('success');

      // 寤惰繜璋冪敤鎴愬姛鍥炶皟
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('鎻愪氦鐢宠澶辫触:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDurationMs = (duration: DurationValue): number => {
    switch (duration) {
      case '1w':
        return 7 * 24 * 60 * 60 * 1000;
      case '1m':
        return 30 * 24 * 60 * 60 * 1000;
      case '3m':
        return 90 * 24 * 60 * 60 * 1000;
      case '6m':
        return 180 * 24 * 60 * 60 * 1000;
      case '1y':
        return 365 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  const getPurposeDescription = (purpose: string) => {
    switch (purpose) {
      case 'parent-view':
        return '鏌ョ湅瀛╁瓙鐨勫涔犺繘搴︺€佸畬鎴愭儏鍐点€佽幏寰楃殑寰界珷绛夊涔犳暟鎹?;
      case 'parent-supervision':
        return '鐩戠潱瀛╁瓙鐨勫涔犵姸鎬侊紝纭繚鎸夋椂瀹屾垚瀛︿範浠诲姟';
      case 'parent-support':
        return '浜嗚В瀛╁瓙鐨勫涔犳儏鍐碉紝鎻愪緵蹇呰鐨勫涔犳敮鎸?;
      case 'parent-report':
        return '鐢熸垚璇︾粏鐨勫涔犳姤鍛婏紝浜嗚В瀛╁瓙鐨勫涔犳垚鏋?;
      default:
        return '';
    }
  };

  if (submitStatus === 'success') {
    return (
      <Card className="success-card">
        <div className="success-content">
          <div className="success-icon">鉁?/div>
          <h3>鐢宠鎻愪氦鎴愬姛锛?/h3>
          <p>鎮ㄧ殑鐢宠宸插彂閫佺粰瀛╁瓙锛岃绛夊緟瀛╁瓙鍚屾剰鎺堟潈銆?/p>
          <p>瀛╁瓙灏嗗湪瀛︾敓绔敹鍒伴€氱煡锛屾偍涔熷彲浠ユ彁閱掑瀛愭煡鐪嬨€?/p>
          <Button variant="primary" onClick={onSuccess}>
            纭畾
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="request-access-form">
      <h2>鐢宠鏌ョ湅瀛╁瓙鏁版嵁</h2>
      <p className="form-description">
        璇疯緭鍏ュ瀛愮殑娉ㄥ唽閭锛屾垜浠皢鍚戝瀛愬彂閫佹巿鏉冭姹傘€?        瀛╁瓙闇€瑕佸湪瀛︾敓绔悓鎰忓悗锛屾偍鎵嶈兘鏌ョ湅鍏跺涔犳暟鎹€?      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label="瀛╁瓙閭"
          error={errors.studentEmail}
          required
          helpText="璇疯緭鍏ュ瀛愬湪骞冲彴涓婃敞鍐岀殑閭鍦板潃"
        >
          <FormInput
            register={register()}
            type="email"
            placeholder="child@example.com"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="鐢宠鐩殑"
          error={errors.purpose}
          required
          helpText={getPurposeDescription(selectedPurpose)}
        >
          <FormSelect
            register={register()}
            options={purposeOptions}
            placeholder="璇烽€夋嫨鐢宠鐩殑"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="鐢宠鐞嗙敱"
          error={errors.reason}
          required
          helpText="璇疯缁嗚鏄庢偍鐢宠鏌ョ湅瀛╁瓙鏁版嵁鐨勫師鍥狅紝杩欏皢甯姪瀛╁瓙鐞嗚В鎮ㄧ殑鎰忓浘"
        >
          <FormTextarea
            register={register()}
            placeholder="璇疯缁嗚鏄庣敵璇风悊鐢?.."
            rows={4}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="鎺堟潈鏈熼檺"
          error={errors.duration}
          helpText="閫夋嫨鎮ㄥ笇鏈涜幏寰楁巿鏉冪殑鏃堕暱锛屽埌鏈熷悗闇€瑕侀噸鏂扮敵璇?
        >
          <FormSelect
            register={register()}
            options={durationOptions}
            placeholder="璇烽€夋嫨鎺堟潈鏈熼檺"
            disabled={isSubmitting}
          />
        </FormField>

        {submitStatus === 'error' && (
          <div className="error-message">
            <p>鉂?鎻愪氦澶辫触锛岃妫€鏌ョ綉缁滆繛鎺ュ悗閲嶈瘯</p>
          </div>
        )}

        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            鍙栨秷
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? '鎻愪氦涓?..' : '鎻愪氦鐢宠'}
          </Button>
        </div>
      </form>

      <div className="privacy-notice">
        <h4>闅愮淇濇姢璇存槑</h4>
        <ul>
          <li>鎴戜滑涓ユ牸淇濇姢瀛╁瓙鐨勯殣绉侊紝鍙湁鍦ㄥ瀛愭槑纭悓鎰忕殑鎯呭喌涓嬫墠浼氬垎浜暟鎹?/li>
          <li>鎮ㄥ彲浠ラ殢鏃舵挙閿€鎺堟潈锛屽瀛愪篃鍙互闅忔椂鎷掔粷鎴栨挙閿€鎮ㄧ殑璁块棶鏉冮檺</li>
          <li>鎴戜滑鍙垎浜偍鏄庣‘鐢宠鐨勬暟鎹被鍨嬶紝涓嶄細瓒呭嚭鎺堟潈鑼冨洿</li>
          <li>鎵€鏈夋暟鎹闂兘鏈夎缁嗙殑瀹¤璁板綍锛岀‘淇濋€忔槑鍜屽彲杩芥函</li>
        </ul>
      </div>
    </Card>
  );
}


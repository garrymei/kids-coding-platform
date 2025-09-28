import { useParams } from 'react-router-dom';
import { Card } from '@kids/ui-kit';

export function PlayPage() {
  const { levelId } = useParams<{ levelId: string }>();

  return (
    <div style={{ padding: '20px' }}>
      <Card heading={`🎮 关卡挑战 - ${levelId}`}>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f8faff',
            borderRadius: '10px',
            border: '1px solid #e0e7ff',
            textAlign: 'center',
          }}
        >
          <h3>关卡 {levelId} 正在加载中...</h3>
          <p>这里将展示具体的编程挑战</p>
          <ul style={{ textAlign: 'left', marginTop: '20px' }}>
            <li>✅ 关卡目标与说明</li>
            <li>✅ Blockly 编程环境</li>
            <li>✅ 实时代码执行</li>
            <li>✅ 通关奖励与评分</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
